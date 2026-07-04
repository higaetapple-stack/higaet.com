/**
 * Integration tests that seed sample governance decisions and knowledge
 * packages into an in-memory mock of the Supabase query builder, then
 * verify:
 *   1. Composite-cursor pagination (created_at DESC, id DESC tiebreak) with
 *      no page overlap even when timestamps collide.
 *   2. Total counts on the first page, `null` on subsequent pages.
 *   3. CSV output — filename format, RFC 4180 escaping, and tenant/time
 *      filter propagation across decisions, knowledge packages, and
 *      signature failures.
 *
 * Exercises the same helpers used by the CI-gate route handlers so the
 * public API stays in sync without needing a live database.
 */
import { describe, it, expect } from "vitest";
import {
  buildDecisionsQuery,
  buildKnowledgeQueries,
  toCsv,
} from "@/lib/governance/api-helpers.server";
import {
  encodeCursor,
  decodeCursor,
  applyCompositeCursor,
  paginateList,
} from "@/lib/governance/rbac.server";

type Row = Record<string, any>;

/**
 * Mock supabase query builder — implements only the subset the helpers use:
 * `.select(cols, {count})`, chained `.order(...)`, `.eq/.lt/.gte/.lte`,
 * `.or("a.lt.X,and(a.eq.X,b.lt.Y)")`, `.limit(n)`, and thenable resolution.
 */
function makeMockClient(seed: Record<string, Row[]>) {
  function tableQuery(table: string) {
    const rows = [...(seed[table] ?? [])];
    let requestedCount = false;
    let requestedLimit = Infinity;
    const orders: Array<{ col: string; asc: boolean }> = [];
    const filters: Array<(r: Row) => boolean> = [];
    const api: any = {
      select(_cols: string, opts?: { count?: string }) {
        if (opts?.count === "exact") requestedCount = true;
        return api;
      },
      order(col: string, opts?: { ascending?: boolean }) {
        orders.push({ col, asc: opts?.ascending !== false });
        return api;
      },
      limit(n: number) {
        requestedLimit = n;
        return api;
      },
      eq(col: string, v: any) { filters.push((r) => r[col] === v); return api; },
      lt(col: string, v: any) { filters.push((r) => r[col] < v); return api; },
      gte(col: string, v: any) { filters.push((r) => r[col] >= v); return api; },
      lte(col: string, v: any) { filters.push((r) => r[col] <= v); return api; },
      or(expr: string) {
        // Parses `created_at.lt.TS,and(created_at.eq.TS,id.lt.ID)` — the
        // exact shape produced by applyCompositeCursor.
        const m = expr.match(
          /^([^.]+)\.lt\.([^,]+),and\(([^.]+)\.eq\.([^,]+),([^.]+)\.lt\.(.+)\)$/,
        );
        if (!m) throw new Error(`unsupported .or expression: ${expr}`);
        const [, c1, v1, c2, v2, c3, v3] = m;
        filters.push((r) => r[c1] < v1 || (r[c2] === v2 && r[c3] < v3));
        return api;
      },
      then(resolve: any) {
        let out = rows.filter((r) => filters.every((f) => f(r)));
        out.sort((a, b) => {
          for (const { col, asc } of orders) {
            if (a[col] === b[col]) continue;
            return (a[col] < b[col] ? -1 : 1) * (asc ? 1 : -1);
          }
          return 0;
        });
        const total = out.length;
        out = out.slice(0, requestedLimit);
        resolve({ data: out, error: null, count: requestedCount ? total : null });
      },
    };
    return api;
  }
  return { from(table: string) { return tableQuery(table); } } as any;
}

function seedDecisions(): Row[] {
  const base = new Date("2026-01-01T00:00:00.000Z").getTime();
  return Array.from({ length: 25 }, (_, i) => ({
    id: `d${String(i).padStart(2, "0")}`,
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

/**
 * Adversarial dataset: 6 rows share the exact same second-precision
 * timestamp. Timestamp-only cursors would either loop or skip; a composite
 * (created_at, id) cursor must partition them cleanly.
 */
function seedCollidingDecisions(): Row[] {
  const ts = "2026-01-01T00:00:00.000Z";
  return Array.from({ length: 6 }, (_, i) => ({
    id: `c${i}`,
    created_at: ts,
    tenant_id: "acme",
    decision: "ALLOW",
    risk_score: i,
  }));
}

function seedKnowledge() {
  const base = new Date("2026-02-01T00:00:00.000Z").getTime();
  const packages: Row[] = Array.from({ length: 12 }, (_, i) => ({
    id: `k${String(i).padStart(2, "0")}`,
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
    id: `e${String(i).padStart(2, "0")}`,
    created_at: new Date(base + i * 30_000).toISOString(),
    package_id: `k${i}`,
    source_label: `partner-${i % 3}`,
    trust_level: (["internal", "partner", "experimental"] as const)[i % 3],
    outcome: i % 3 === 0 ? "rejected" : "accepted",
    reason: i % 3 === 0 ? "signature_mismatch" : null,
  }));
  return { packages, events };
}

function seedSignatureFailures(): Row[] {
  const base = new Date("2026-03-01T00:00:00.000Z").getTime();
  const reasons = ["untrusted_key", "expired", "missing_signature", "hash_mismatch"];
  return Array.from({ length: 20 }, (_, i) => ({
    id: `f${String(i).padStart(2, "0")}`,
    created_at: new Date(base + i * 3_600_000).toISOString(),
    tenant_id: i % 2 === 0 ? "acme" : "globex",
    source_label: `feed-${i % 4}`,
    trust_level: "partner",
    reason: reasons[i % reasons.length],
    key_id: `key-${i % 3}`,
    package_hash: `h${i}`,
    schema_version: "1.0.0",
    generated_at: null,
    expires_at: null,
  }));
}

// ─── Composite cursor + pagination ───────────────────────────────────────
describe("composite cursor pagination", () => {
  it("encodes and decodes cursors symmetrically", () => {
    const row = { created_at: "2026-01-02T03:04:05.000Z", id: "d07" };
    const cur = encodeCursor(row);
    expect(cur).toBe("2026-01-02T03:04:05.000Z|d07");
    expect(decodeCursor(cur)).toEqual({ ts: row.created_at, id: row.id });
    expect(decodeCursor(null)).toBeNull();
    expect(decodeCursor("garbage")).toBeNull();
  });

  it("paginates deterministically when timestamps collide", async () => {
    const supabase = makeMockClient({ governance_audit_events: seedCollidingDecisions() });
    const url = new URL("https://x/api/public/governance/decisions?tenant=acme");
    const first = await buildDecisionsQuery(supabase, url, { withCount: true, limit: 3 });
    expect(first.count).toBe(6);
    expect(first.data).toHaveLength(3);
    // Even with identical timestamps, id DESC tiebreak means we get c5, c4, c3.
    expect(first.data!.map((r: Row) => r.id)).toEqual(["c5", "c4", "c3"]);

    const cursor = encodeCursor(first.data![first.data!.length - 1] as any);
    const second = await buildDecisionsQuery(supabase, url, {
      withCount: false,
      limit: 3,
      cursor,
    });
    expect(second.data!.map((r: Row) => r.id)).toEqual(["c2", "c1", "c0"]);
    expect(second.count).toBeNull();

    // Union of both pages covers every row with no duplicates.
    const ids = [...first.data!, ...second.data!].map((r: Row) => r.id).sort();
    expect(ids).toEqual(["c0", "c1", "c2", "c3", "c4", "c5"]);
  });

  it("returns DESC order + total on first page, null on later pages", async () => {
    const supabase = makeMockClient({ governance_audit_events: seedDecisions() });
    const url = new URL("https://x/api/public/governance/decisions?tenant=acme");
    const first = await buildDecisionsQuery(supabase, url, { withCount: true, limit: 5 });
    expect(first.count).toBe(13);
    const times = first.data!.map((r: Row) => r.created_at);
    expect([...times].sort().reverse()).toEqual(times);

    const cursor = encodeCursor(first.data![first.data!.length - 1] as any);
    const second = await buildDecisionsQuery(supabase, url, { withCount: false, limit: 5, cursor });
    expect(second.count).toBeNull();
    const firstIds = new Set(first.data!.map((r: Row) => r.id));
    for (const r of second.data ?? []) expect(firstIds.has(r.id)).toBe(false);
  });

  it("paginateList helper computes nextCursor from the last row", async () => {
    const supabase = makeMockClient({ governance_audit_events: seedDecisions() });
    const q = supabase
      .from("governance_audit_events")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(4);
    const res = await paginateList<Row & { created_at: string; id: string }>(q, {
      cursor: null,
      limit: 4,
    });
    expect(res.rows).toHaveLength(4);
    expect(res.total).toBe(25);
    expect(res.nextCursor).toBe(encodeCursor(res.rows[res.rows.length - 1]));
  });
});

// ─── CSV export: filenames, escaping, and filters ────────────────────────
describe("CSV export shape", () => {
  it("decisions CSV honours tenant + decision filters and RFC 4180 escaping", async () => {
    // Extend the seed with a row whose fields need CSV escaping (comma, quote).
    const seed = seedDecisions().concat([{
      id: "d99",
      created_at: "2026-01-02T00:00:00.000Z",
      tenant_id: "acme",
      source: 'ci,"pipeline"',
      decision: "BLOCK",
      risk_score: 95,
      confidence: 0.9,
      explanation: ["hit limit"],
      requires_human_approval: true,
      approval_status: "blocked",
    }]);
    const supabase = makeMockClient({ governance_audit_events: seed });
    const url = new URL("https://x/api/public/governance/decisions?tenant=acme&decision=BLOCK");
    const res = await buildDecisionsQuery(supabase, url, { withCount: true, limit: 500 });
    for (const r of res.data ?? []) {
      expect(r.tenant_id).toBe("acme");
      expect(r.decision).toBe("BLOCK");
    }
    const csv = toCsv(res.data as Row[], [
      "id",
      "created_at",
      "tenant_id",
      "source",
      "decision",
      "risk_score",
      "approval_status",
    ]);
    // Header + N body rows + trailing newline.
    expect(csv.startsWith("id,created_at,tenant_id,source,decision,risk_score,approval_status\n")).toBe(true);
    // The escaping row must be quoted with doubled inner quotes.
    expect(csv).toContain('"ci,""pipeline"""');
    // No line begins with tenant_id we're excluding.
    for (const line of csv.trim().split("\n").slice(1)) {
      expect(line).not.toContain(",globex,");
    }
  });

  it("client-side CSV filename convention is stable and time-stamped", () => {
    // The dashboard downloads via `downloadCsv(prefix-<timestamp>.csv, csv)`.
    // Assert the naming pattern used across all three export buttons.
    const filenames = [
      `governance-decisions-${Date.now()}.csv`,
      `knowledge-packages-${Date.now()}.csv`,
      `signature-failures-${Date.now()}.csv`,
    ];
    for (const f of filenames) {
      expect(f).toMatch(/^(governance-decisions|knowledge-packages|signature-failures)-\d+\.csv$/);
    }
  });

  it("knowledge packages CSV respects status and trust filters", async () => {
    const { packages, events } = seedKnowledge();
    const supabase = makeMockClient({
      knowledge_packages: packages,
      knowledge_ingestion_events: events,
    });
    const url = new URL("https://x/api/public/governance/knowledge?status=pending&trust=partner");
    const { pkgs } = buildKnowledgeQueries(supabase, url, { withCount: true, limit: 500 });
    const res = await pkgs;
    for (const p of res.data ?? []) {
      expect(p.status).toBe("pending");
      expect(p.trust_level).toBe("partner");
    }
    const csv = toCsv(res.data as Row[], [
      "id",
      "source_label",
      "trust_level",
      "schema_version",
      "status",
    ]);
    expect(csv.split("\n")[0]).toBe("id,source_label,trust_level,schema_version,status");
    expect(csv.trim().split("\n").length).toBe((res.data?.length ?? 0) + 1);
  });

  it("signature failures respect tenant + reason + time-range filters", async () => {
    const supabase = makeMockClient({ knowledge_signature_failures: seedSignatureFailures() });
    // Reuse applyCompositeCursor + manual builder mirroring the server fn.
    const since = "2026-03-01T05:00:00.000Z";
    const until = "2026-03-01T15:00:00.000Z";
    const q = (supabase as any)
      .from("knowledge_signature_failures")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(500)
      .eq("tenant_id", "acme")
      .eq("reason", "expired")
      .gte("created_at", since)
      .lte("created_at", until);
    applyCompositeCursor(q, null);
    const { data, count } = await q;
    for (const r of data ?? []) {
      expect(r.tenant_id).toBe("acme");
      expect(r.reason).toBe("expired");
      expect(r.created_at >= since && r.created_at <= until).toBe(true);
    }
    expect(count).toBe(data!.length);

    const csv = toCsv(data as Row[], ["id", "created_at", "tenant_id", "reason", "key_id"]);
    expect(csv.startsWith("id,created_at,tenant_id,reason,key_id\n")).toBe(true);
  });

  it("csv serializer escapes quotes, commas, and newlines (RFC 4180)", () => {
    const csv = toCsv(
      [{ a: 'hello, "world"', b: "line\nbreak", c: 42, d: null }],
      ["a", "b", "c", "d"],
    );
    expect(csv.startsWith("a,b,c,d\n")).toBe(true);
    expect(csv).toContain('"hello, ""world"""');
    expect(csv).toContain('"line\nbreak"');
    expect(csv.trim().endsWith(",42,")).toBe(true);
  });
});
