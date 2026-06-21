// Phase 6 — Observability server functions.
// Client-safe to import; handler bodies stripped from client bundle.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import type { JsonValue } from "./notifications/types";

export interface SystemErrorRow {
  id: string;
  occurred_at: string;
  source: string;
  level: string;
  message: string;
  name: string | null;
  stack: string | null;
  release: string | null;
  environment: string | null;
  url: string | null;
  user_id: string | null;
  user_role: string | null;
  route: string | null;
  trace_id: string | null;
  fingerprint: string | null;
  context: JsonValue;
  user_agent: string | null;
}

export interface SystemMetricRow {
  id: string;
  recorded_at: string;
  kind: string;
  name: string;
  duration_ms: number;
  status: string | null;
  user_id: string | null;
  context: JsonValue;
}

export interface ObservabilitySummary {
  window_hours: number;
  errors_total: number;
  errors_by_source: Record<string, number>;
  errors_by_level: Record<string, number>;
  top_fingerprints: Array<{
    fingerprint: string;
    occurrences: number;
    last_seen: string;
    sample_message: string;
  }>;
  security_events_total: number;
  notifications_failed: number;
  notifications_delivered: number;
  perf_p95_route_ms: number | null;
  perf_p95_server_fn_ms: number | null;
}

// ---------- Client error ingestion ----------
const ingestInput = z.object({
  message: z.string().min(1).max(4000),
  name: z.string().max(200).optional().nullable(),
  stack: z.string().max(16000).optional().nullable(),
  url: z.string().max(2000).optional().nullable(),
  route: z.string().max(500).optional().nullable(),
  level: z.enum(["warning", "error", "fatal"]).optional(),
  context: z.record(z.string(), z.unknown()).optional(),
});

export const ingestClientError = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => ingestInput.parse(d))
  .handler(async ({ data, context }) => {
    const { recordSystemError } = await import("./observability/events.server");
    const { id } = await recordSystemError({
      source: "client",
      level: data.level ?? "error",
      message: data.message,
      name: data.name ?? null,
      stack: data.stack ?? null,
      url: data.url ?? null,
      route: data.route ?? null,
      userId: context.userId,
      context: data.context as Record<string, unknown> | undefined,
    });
    return { id };
  });

async function assertAdmin(ctx: {
  supabase: { rpc: (name: "has_role", args: { _user_id: string; _role: "admin" | "super_admin" }) => Promise<{ data: boolean | null; error: { message: string } | null }> };
  userId: string;
}) {
  const { data: isAdmin, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (isAdmin) return;
  const { data: isSuper } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "super_admin",
  });
  if (!isSuper) throw new Error("Forbidden");
}

// ---------- Admin: list recent errors ----------
const listErrorsInput = z.object({
  limit: z.number().int().min(1).max(200).default(50),
  source: z
    .enum(["client", "server_fn", "api_route", "background", "realtime", "auth"])
    .optional(),
  level: z.enum(["warning", "error", "fatal"]).optional(),
});

export const adminListSystemErrors = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => listErrorsInput.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    let q = context.supabase
      .from("system_errors")
      .select("*")
      .order("occurred_at", { ascending: false })
      .limit(data.limit);
    if (data.source) q = q.eq("source", data.source);
    if (data.level) q = q.eq("level", data.level);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return (rows ?? []) as SystemErrorRow[];
  });

// ---------- Admin: recent metrics ----------
export const adminListSystemMetrics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        kind: z.enum(["route", "server_fn", "api_route", "query", "ai"]).optional(),
        limit: z.number().int().min(1).max(500).default(100),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    let q = context.supabase
      .from("system_metrics")
      .select("*")
      .order("recorded_at", { ascending: false })
      .limit(data.limit);
    if (data.kind) q = q.eq("kind", data.kind);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return (rows ?? []) as SystemMetricRow[];
  });

// ---------- Admin: summary ----------
export const adminObservabilitySummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ hours: z.number().int().min(1).max(720).default(24) }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const { data: summary, error } = await context.supabase.rpc(
      "observability_summary",
      { _window: `${data.hours} hours` },
    );
    if (error) throw new Error(error.message);
    return (summary ?? {}) as ObservabilitySummary;
  });
