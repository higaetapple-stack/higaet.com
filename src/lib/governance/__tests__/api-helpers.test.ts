/**
 * Integration tests that seed sample governance decisions and knowledge
 * packages into an in-memory mock of the Supabase query builder, then
 * verify:
 *   1. Pagination order (created_at desc) and cursor advancement.
 *   2. Total counts on the first page + null on subsequent pages.
 *   3. CSV output shape matches the requested filters.
 *
 * We exercise the same helpers used by the CI-gate route handlers
 * (`buildDecisionsQuery`, `buildKnowledgeQueries`, `toCsv`) so behaviour
 * stays in sync with the public API without needing a live database.
 */
import { describe, it, expect } from "vitest";
import {
  buildDecisionsQuery,
  buildKnowledgeQueries,
  toCsv,
} from "@/lib/governance/api-helpers.server";

type Row = Record<string, any>;

function makeMockClient(seed: Record<string, Row[]>) {
  function tableQuery(table: string) {
    let rows = [...(seed[table] ?? [])];
    let requestedCount = false;
    let requestedLimit = Infinity;
    const state = {
      filters: [] as Array<(r: Row) => boolean>,
      order: null as null | { col: string; asc: boolean },
    };
    const api: any = {
      select(_cols: string, opts?: { count?: string }) {
        if (opts?.count === "exact") requestedCount = true;
        return api;
      },
      order(col: string, opts?: { ascending?: boolean }) {
        state.order = { col, asc: opts?.ascending !== false };
        return api;
      },
      limit(n: number) {
        requestedLimit = n;
        return api;
      },
      eq(col: string, v: any) {
        state.filters.push((r) => r[col] === v);
        return api;
      },
      lt(col: string, v: any) {
        state.filters.push((r) => r[col] < v);
        return api;
      },
      gte(col: string, v: any) {
        state.filters.push((r) => r[col] >= v);
        return api;
      },
      lte(col: string, v: any) {
        state.filters.push((r) => r[col] <= v);
        return api;
      },
      then(resolve: any) {
        let out = rows.filter((r) => state.filters.every((f) => f(r)));
        if (state.order) {
          const { col, asc } = state.order;
          out.sort((a, b) => (a[col] < b[col] ? -1 : a[col] > b[col] ? 1 : 0) * (asc ? 1 : -1));
        }
        const total = out.length;
        out = out.slice(0, requestedLimit);
        resolve({ data: out, error: null, count: requestedCount ? total : null });
      },
    };
    return api;
  }
  return {
    from(table: string) {
      return tableQuery(table);
    },
  } as any;
}

function seedDecisions(): Row[] {
  const base = new Date("2026-01-01T00:00:00.000Z").getTime();
  return Array.from({ length: 25 }, (_, i) => ({
    id: `d${i}`,
    created_at: new Date(base + i * 60_000).toISOString(),
    tenant_id: i % 2 === 0 ? "acme" : "globex",
    source: "orchestrator",
    decision: ["ALLOW", "WARN", "BLOCK", "REVIEW_REQUIRED"][i % 4],
    risk_score: i * 3,
    confidence: 0.5 + (i % 5) * 0.1,
    explanation: [],
    requires_human_approval: i % 4 === 3,
    approval_status: ["auto", "pending", "auto", "pending"][i % 4],
  }));
}

function seedKnowledge() {
  const base = new Date("2026-02-01T00:00:00.000Z").getTime();
  const packages: Row[] = Array.from({ length: 12 }, (_, i) => ({
    id: `k${i}`,
    created_at: new Date(base + i * 60_000).toISOString(),
    source_label: `partner-${i % 3}`,
    trust_level: (["internal", "partner", "experimental"] as const)[i % 3],
    schema_version: "1.0.0",
    generated_at: new Date(base + i * 60_000).toISOString(),
    expires_at: new Date(base + i * 60_000 + 86_400_000).toISOString(),
    signature_valid: i % 2 === 0,
    status: (["pending", "approved", "rejected"] as const)[i % 3],
    reviewed_at: null,
  }));
  const events: Row[] = Array.from({ length: 8 }, (_, i) => ({
    id: `e${i}`,
    created_at: new Date(base + i * 30_000).toISOString(),
    package_id: `k${i}`,
    source_label: `partner-${i % 3}`,
    trust_level: (["internal", "partner", "experimental"] as const)[i % 3],
    outcome: i % 3 === 0 ? "rejected" : "accepted",
    reason: i % 3 === 0 ? "signature_mismatch" : null,
  }));
  return { packages, events };
}

describe("governance api helpers — pagination, counts, CSV", () => {
  it("returns decisions ordered by created_at DESC with count on first page", async () => {
    const supabase = makeMockClient({ governance_audit_events: seedDecisions() });
    const url = new URL("https://x/api/public/governance/decisions?tenant=acme");

    const first = await buildDecisionsQuery(supabase, url, { withCount: true, limit: 5 });
    expect(first.error).toBeNull();
    expect(first.count).toBe(13); // 25 rows, tenant=acme → 13
    expect(first.data).toHaveLength(5);
    // Descending order
    const times = first.data!.map((r: Row) => r.created_at);
    expect([...times].sort().reverse()).toEqual(times);

    // Cursor should be the last (oldest) created_at in the page.
    const cursor = first.data![first.data!.length - 1].created_at;
    const second = await buildDecisionsQuery(supabase, url, {
      withCount: false,
      limit: 5,
      cursor,
    });
    expect(second.count).toBeNull();
    // No overlap with the first page.
    const firstIds = new Set(first.data!.map((r: Row) => r.id));
    for (const r of second.data ?? []) expect(firstIds.has(r.id)).toBe(false);
    // Still descending, strictly older than cursor.
    for (const r of second.data ?? []) expect(r.created_at < cursor).toBe(true);
  });

  it("filters decisions by decision type and yields matching CSV", async () => {
    const supabase = makeMockClient({ governance_audit_events: seedDecisions() });
    const url = new URL("https://x/api/public/governance/decisions?decision=BLOCK");
    const res = await buildDecisionsQuery(supabase, url, { withCount: true, limit: 100 });
    expect(res.data!.every((r: Row) => r.decision === "BLOCK")).toBe(true);
    expect(res.count).toBe(res.data!.length);

    const csv = toCsv(res.data as Row[], [
      "id",
      "created_at",
      "tenant_id",
      "decision",
      "risk_score",
      "approval_status",
    ]);
    const [header, ...body] = csv.trim().split("\n");
    expect(header).toBe("id,created_at,tenant_id,decision,risk_score,approval_status");
    expect(body.length).toBe(res.data!.length);
    for (const line of body) expect(line).toContain(",BLOCK,");
  });

  it("paginates knowledge packages and events with counts + cursors", async () => {
    const { packages, events } = seedKnowledge();
    const supabase = makeMockClient({
      knowledge_packages: packages,
      knowledge_ingestion_events: events,
    });
    const url = new URL("https://x/api/public/governance/knowledge?status=pending");
    const q1 = buildKnowledgeQueries(supabase, url, { withCount: true, limit: 3 });
    const [pkgs, evts] = await Promise.all([q1.pkgs, q1.events]);
    expect(pkgs.count).toBe(packages.filter((p) => p.status === "pending").length);
    expect(pkgs.data!.every((p: Row) => p.status === "pending")).toBe(true);
    expect(pkgs.data).toHaveLength(3);
    expect(evts.data!.length).toBeLessThanOrEqual(3);

    const cursor = pkgs.data![pkgs.data!.length - 1].created_at;
    const q2 = buildKnowledgeQueries(supabase, url, {
      withCount: false,
      limit: 3,
      cursor,
    });
    const pkgs2 = await q2.pkgs;
    expect(pkgs2.count).toBeNull();
    for (const p of pkgs2.data ?? []) expect(p.created_at < cursor).toBe(true);
  });

  it("csv serializer escapes quotes, commas, and newlines", () => {
    const csv = toCsv(
      [{ a: 'hello, "world"', b: "line\nbreak", c: 42, d: null }],
      ["a", "b", "c", "d"],
    );
    // Header is on its own line; the quoted cell containing \n makes the row span two lines.
    expect(csv.startsWith("a,b,c,d\n")).toBe(true);
    expect(csv).toContain('"hello, ""world"""');
    expect(csv).toContain('"line\nbreak"');
    expect(csv.trim().endsWith(",42,")).toBe(true);
  });
});
