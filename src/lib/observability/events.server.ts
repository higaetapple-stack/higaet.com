// Server-only observability ingestion.
// Inserts a row into system_errors, forwards to Sentry, and emits a
// domain event so the Phase 3A notification platform can surface alerts.
// Import dynamically inside server-fn handlers (do NOT import at module
// scope from a .functions.ts file).

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { captureServerError } from "./sentry-server";

export type SystemErrorSource =
  | "client"
  | "server_fn"
  | "api_route"
  | "background"
  | "realtime"
  | "auth";

export type SystemErrorLevel = "warning" | "error" | "fatal";

export interface RecordSystemErrorInput {
  source: SystemErrorSource;
  level?: SystemErrorLevel;
  message: string;
  name?: string | null;
  stack?: string | null;
  url?: string | null;
  route?: string | null;
  userId?: string | null;
  userRole?: string | null;
  traceId?: string | null;
  userAgent?: string | null;
  context?: Record<string, unknown>;
}

function fingerprint(input: RecordSystemErrorInput): string {
  const head =
    (input.stack ?? input.message)
      .split("\n")
      .slice(0, 3)
      .join("|")
      .slice(0, 240) || input.message.slice(0, 240);
  return `${input.source}:${input.name ?? "Error"}:${head}`;
}

export async function recordSystemError(input: RecordSystemErrorInput) {
  const level = input.level ?? "error";
  const fp = fingerprint(input);
  const env = process.env.SENTRY_ENV ?? process.env.NODE_ENV ?? "production";
  const release = process.env.SENTRY_RELEASE ?? null;

  const { data, error } = await supabaseAdmin
    .from("system_errors")
    .insert({
      source: input.source,
      level,
      message: input.message.slice(0, 4000),
      name: input.name ?? null,
      stack: input.stack ?? null,
      release,
      environment: env,
      url: input.url ?? null,
      user_id: input.userId ?? null,
      user_role: input.userRole ?? null,
      route: input.route ?? null,
      trace_id: input.traceId ?? null,
      fingerprint: fp,
      user_agent: input.userAgent ?? null,
      context: (input.context ?? {}) as never,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[observability] insert failed", error.message);
  }

  // Fire-and-forget Sentry capture.
  void captureServerError(new Error(input.message), {
    tags: { source: input.source, level, route: input.route ?? "" },
    extra: { stack: input.stack, ...input.context },
    traceId: input.traceId ?? undefined,
  });

  // Fan out a domain event so notification rules / admin alerts pick it up.
  if (level === "fatal" || level === "error") {
    try {
      await supabaseAdmin.rpc("emit_domain_event", {
        _event_type: level === "fatal" ? "system.degraded" : "system.error",
        _actor_id: input.userId ?? null,
        _payload: {
          source: input.source,
          message: input.message.slice(0, 500),
          fingerprint: fp,
          route: input.route,
          trace_id: input.traceId,
        } as never,
      });
    } catch (e) {
      console.error("[observability] domain event emit failed", e);
    }
  }

  return { id: data?.id ?? null, fingerprint: fp };
}

export interface RecordSystemMetricInput {
  kind: "route" | "server_fn" | "api_route" | "query" | "ai";
  name: string;
  durationMs: number;
  status?: string | null;
  userId?: string | null;
  context?: Record<string, unknown>;
}

export async function recordSystemMetric(input: RecordSystemMetricInput) {
  const { error } = await supabaseAdmin.from("system_metrics").insert({
    kind: input.kind,
    name: input.name.slice(0, 200),
    duration_ms: Math.max(0, Math.round(input.durationMs)),
    status: input.status ?? null,
    user_id: input.userId ?? null,
    context: (input.context ?? {}) as never,
  });
  if (error) console.error("[observability] metric insert failed", error.message);
}

/**
 * Wrap a server-fn handler body to capture exceptions + record latency.
 *
 * Usage inside a `.handler(async (ctx) => withObservability("name", ctx, async () => { ... }))`.
 */
export async function withObservability<T>(
  name: string,
  ctx: { userId?: string | null } | null,
  fn: () => Promise<T>,
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    await recordSystemMetric({
      kind: "server_fn",
      name,
      durationMs: Date.now() - start,
      status: "ok",
      userId: ctx?.userId ?? null,
    });
    return result;
  } catch (err) {
    const e = err instanceof Error ? err : new Error(String(err));
    await recordSystemError({
      source: "server_fn",
      message: e.message,
      name: e.name,
      stack: e.stack,
      userId: ctx?.userId ?? null,
      context: { fn: name },
    });
    await recordSystemMetric({
      kind: "server_fn",
      name,
      durationMs: Date.now() - start,
      status: "error",
      userId: ctx?.userId ?? null,
    });
    throw err;
  }
}
