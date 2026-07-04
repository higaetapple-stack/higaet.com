/**
 * Shared server-only helpers for the governance CI-gate endpoints:
 * - constant-time API key auth
 * - filter/composite-cursor builders for decisions + knowledge tables
 * - CSV serialization with proper RFC 4180 escaping
 *
 * Cursors are composite `${created_at}|${id}` strings so that pages remain
 * deterministic when multiple rows share the same second-precision
 * timestamp — critical on high-volume audit tables.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { decodeCursor, applyCompositeCursor } from "./rbac.server";

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

export function authorizedGovernanceRequest(request: Request): boolean {
  const presented = request.headers.get("x-governance-api-key") ?? "";
  const expected = process.env.GOVERNANCE_CI_API_KEY ?? "";
  return expected.length > 0 && timingSafeEqual(presented, expected);
}

type Client = SupabaseClient<any, any, any>;

export function buildDecisionsQuery(
  supabase: Client,
  url: URL,
  opts: { withCount: boolean; limit: number; cursor?: string | null },
) {
  const view = url.searchParams.get("view") ?? "recent";
  const tenant = url.searchParams.get("tenant");
  const decision = url.searchParams.get("decision");

  let q = supabase
    .from("governance_audit_events")
    .select(
      "id,created_at,tenant_id,source,decision,risk_score,confidence,explanation,requires_human_approval,approval_status",
      opts.withCount ? { count: "exact" } : undefined,
    )
    .order("created_at", { ascending: false })
    .limit(opts.limit);

  if (view === "pending") q = q.eq("approval_status", "pending");
  if (tenant) q = q.eq("tenant_id", tenant);
  if (decision) q = q.eq("decision", decision);
  applyCompositeCursor(q, decodeCursor(opts.cursor ?? null));
  return q;
}

export function buildKnowledgeQueries(
  supabase: Client,
  url: URL,
  opts: {
    withCount: boolean;
    limit: number;
    cursor?: string | null;
    eventsCursor?: string | null;
  },
) {
  const status = url.searchParams.get("status");
  const trust = url.searchParams.get("trust");
  const tenant = url.searchParams.get("tenant");

  let pkgsQ = supabase
    .from("knowledge_packages")
    .select(
      "id,created_at,source_label,trust_level,schema_version,generated_at,expires_at,signature_valid,status,reviewed_at",
      opts.withCount ? { count: "exact" } : undefined,
    )
    .order("created_at", { ascending: false })
    .limit(opts.limit);
  if (status) pkgsQ = pkgsQ.eq("status", status);
  if (trust) pkgsQ = pkgsQ.eq("trust_level", trust);
  applyCompositeCursor(pkgsQ, decodeCursor(opts.cursor ?? null));

  let eventsQ = supabase
    .from("knowledge_ingestion_events")
    .select(
      "id,created_at,package_id,source_label,trust_level,outcome,reason",
      opts.withCount ? { count: "exact" } : undefined,
    )
    .order("created_at", { ascending: false })
    .limit(opts.limit);
  if (trust) eventsQ = eventsQ.eq("trust_level", trust);
  if (tenant) eventsQ = eventsQ.eq("source_label", tenant);
  applyCompositeCursor(eventsQ, decodeCursor(opts.eventsCursor ?? null));

  return { pkgs: pkgsQ, events: eventsQ };
}

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = typeof value === "string" ? value : typeof value === "object" ? JSON.stringify(value) : String(value);
  if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export function toCsv<T extends Record<string, unknown>>(rows: T[], columns: (keyof T & string)[]): string {
  const header = columns.map(csvCell).join(",");
  const body = rows.map((r) => columns.map((c) => csvCell(r[c])).join(",")).join("\n");
  return `${header}\n${body}\n`;
}

