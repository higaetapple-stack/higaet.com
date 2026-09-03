import { describe, it, expect, beforeEach } from "vitest";
import { LeadSchema, type LeadPayload } from "@/lib/schemas";
import {
  LEAD_RATE_LIMIT_MESSAGE,
  processLeadSubmission,
  resolveLeadStore,
  type LeadDeps,
} from "@/lib/leads.functions";
import { LIMITS, rateLimitByKey } from "@/lib/rate-limit-core";

const lead = (division: string, source = "test"): LeadPayload =>
  LeadSchema.parse({
    name: "Test User",
    email: "tester@example.com",
    phone: "",
    message: "Hello",
    division,
    source,
  });

function deps(over: Partial<LeadDeps> = {}): LeadDeps & {
  inserts: Array<{ table: string; row: unknown }>;
  notes: Array<{ to: string }>;
} {
  const inserts: Array<{ table: string; row: unknown }> = [];
  const notes: Array<{ to: string }> = [];
  return {
    inserts,
    notes,
    insert: async (table, row) => {
      inserts.push({ table, row });
      return { error: null };
    },
    notify: async (note) => {
      notes.push({ to: note.to });
      return { ok: true };
    },
    limitKey: () => `test::${Date.now()}-${Math.random()}`,
    ...over,
  };
}

describe("persistence routing", () => {
  it("routes main to the generic leads table", () => {
    const t = resolveLeadStore(lead("main", "contact_page"));
    expect(t.table).toBe("leads");
    expect(t.row).toMatchObject({ division: "main", source: "contact_page" });
  });
  it("routes academy to the generic leads table", () => {
    const t = resolveLeadStore(lead("academy", "admissions:x"));
    expect(t.table).toBe("leads");
    expect(t.row).toMatchObject({ division: "academy" });
  });
  it("routes global to study_abroad_leads", () => {
    const t = resolveLeadStore(lead("global", "global_contact"));
    expect(t.table).toBe("study_abroad_leads");
    expect(t.row).toMatchObject({ source: "global_contact" });
  });
  it("routes tech to technologies_leads", () => {
    const t = resolveLeadStore(lead("tech", "technologies_home"));
    expect(t.table).toBe("technologies_leads");
    expect(t.row).toMatchObject({ service_interest: "technologies_home" });
  });
  it("rejects an unknown division", () => {
    expect(() => LeadSchema.parse({ ...lead("main"), division: "press" })).toThrow();
  });
  it("rejects malformed payloads", () => {
    expect(LeadSchema.safeParse({ ...lead("main"), email: "not-an-email" }).success).toBe(false);
    expect(LeadSchema.safeParse({ ...lead("main"), name: "x" }).success).toBe(false);
  });
});

describe("rate limiter", () => {
  it("allows below threshold and blocks at threshold", () => {
    const opts = { name: "test-lead", limit: 2, windowMs: 60_000 };
    const k = `test-lead::${Date.now()}-${Math.random()}`;
    expect(rateLimitByKey(k, opts)).toBeNull();
    expect(rateLimitByKey(k, opts)).toBeNull();
    const blocked = rateLimitByKey(k, opts);
    expect(blocked).not.toBeNull();
    expect(blocked!.retryAfterSec).toBeGreaterThan(0);
  });
  it("resets after the window", async () => {
    const opts = { name: "test-lead", limit: 1, windowMs: 30 };
    const k = `test-lead::${Date.now()}-${Math.random()}`;
    expect(rateLimitByKey(k, opts)).toBeNull();
    expect(rateLimitByKey(k, opts)).not.toBeNull();
    await new Promise((r) => setTimeout(r, 40));
    expect(rateLimitByKey(k, opts)).toBeNull();
  });
  it("lead preset is 5 per 10 minutes", () => {
    expect(LIMITS.leadSubmit).toMatchObject({ limit: 5, windowMs: 600_000 });
  });
});

describe("processLeadSubmission", () => {
  it("persists academy lead to leads and notifies admissions", async () => {
    const d = deps();
    const res = await processLeadSubmission(lead("academy", "academy_contact"), d);
    expect(res).toMatchObject({ ok: true });
    expect(d.inserts).toHaveLength(1);
    expect(d.inserts[0]!.table).toBe("leads");
    expect(d.notes).toEqual([{ to: "admissions@higaet.com" }]);
  });
  it("still notifies when persistence fails (no silent loss)", async () => {
    const d = deps({ insert: async () => ({ error: new Error("db down") }) });
    const res = await processLeadSubmission(lead("main", "contact_page"), d);
    expect(res).toMatchObject({ ok: true });
    expect(d.notes).toHaveLength(1);
  });
  it("still succeeds when notify fails after persistence", async () => {
    const d = deps({ notify: async () => ({ ok: false, error: "smtp down" }) });
    const res = await processLeadSubmission(lead("tech", "x"), d);
    expect(res).toMatchObject({ ok: true });
    expect(d.inserts[0]!.table).toBe("technologies_leads");
  });
  it("rejects the 6th rapid submission without internals", async () => {
    const d = deps({ limitKey: () => "test::ratelimit-fixed-key" });
    for (let i = 0; i < 5; i++) {
      await processLeadSubmission(
        lead("main", "contact_page"),
        deps({ limitKey: () => `test::other-${i}` }),
      );
    }
    for (let i = 0; i < 5; i++) {
      await processLeadSubmission(lead("main", "contact_page"), d);
    }
    await expect(processLeadSubmission(lead("main", "contact_page"), d)).rejects.toThrow(
      LEAD_RATE_LIMIT_MESSAGE,
    );
    expect(LEAD_RATE_LIMIT_MESSAGE).not.toMatch(/bucket|token|window|ip/i);
  });
  it("fails open when limit-key resolution throws", async () => {
    const d = deps({
      limitKey: () => {
        throw new Error("no request context");
      },
    });
    const res = await processLeadSubmission(lead("main", "contact_page"), d);
    expect(res).toMatchObject({ ok: true });
    expect(d.inserts).toHaveLength(1);
  });
});
