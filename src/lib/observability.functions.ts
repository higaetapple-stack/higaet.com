// Phase 6 — Observability server functions.
// Client-safe to import; handler bodies stripped from client bundle.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

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
      context: data.context,
    });
    return { id };
  });

// ---------- Admin: list recent errors ----------
const listInput = z.object({
  limit: z.number().int().min(1).max(200).default(50),
  source: z
    .enum(["client", "server_fn", "api_route", "background", "realtime", "auth"])
    .optional(),
  level: z.enum(["warning", "error", "fatal"]).optional(),
});

async function assertAdmin(ctx: {
  supabase: ReturnType<
    typeof import("@supabase/supabase-js").createClient
  > extends infer C
    ? C
    : never;
  userId: string;
}) {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin" as never,
  });
  if (error) throw new Error(error.message);
  if (data) return;
  const { data: superAdmin } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "super_admin" as never,
  });
  if (!superAdmin) throw new Error("Forbidden");
}

export const adminListSystemErrors = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => listInput.parse(d ?? {}))
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
    return rows ?? [];
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
    return rows ?? [];
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
      { _window: `${data.hours} hours` as never },
    );
    if (error) throw new Error(error.message);
    return summary as Record<string, unknown>;
  });
