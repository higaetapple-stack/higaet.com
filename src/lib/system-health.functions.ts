// Phase 11 — Production Readiness: aggregated launch health snapshot.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.rpc("has_any_role", {
    _user_id: ctx.userId,
    _roles: ["admin", "super_admin"] as unknown as string[],
  });
  if (!data) throw new Error("Forbidden");
}

export interface SystemHealth {
  generated_at: string;
  window_hours: number;
  observability: any;
  notifications: { delivered_24h: number; failed_24h: number; pending: number; failure_rate: number };
  webhooks: { subscriptions: number; delivered_24h: number; failed_24h: number; pending: number; failure_rate: number };
  rag: { queue_pending: number; queue_failed: number; queue_dead: number; embedded_docs: number };
  ai: { conversations_24h: number; messages_24h: number; total_conversations: number };
  api: { active_keys: number; requests_24h: number; error_requests_24h: number; error_rate: number };
  errors: { total_24h: number; critical_24h: number };
  security_events_24h: number;
  status: "healthy" | "degraded" | "critical";
}

async function safeCount(q: any) {
  try {
    const { count } = await q;
    return count ?? 0;
  } catch {
    return 0;
  }
}

export const systemHealthSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SystemHealth> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as any;
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [
      obsResp,
      notifDelivered,
      notifFailed,
      notifPending,
      hookSubs,
      hookDelivered,
      hookFailed,
      hookPending,
      ragPending,
      ragFailed,
      ragDead,
      ragDocs,
      aiConvs24,
      aiMsgs24,
      aiConvsTotal,
      apiKeys,
      apiReqs,
      apiErrReqs,
      errors24,
      criticalErrors24,
      secEvents,
    ] = await Promise.all([
      context.supabase.rpc("observability_summary", { _window: "24 hours" }),
      safeCount(sb.from("notification_delivery_logs").select("id", { head: true, count: "exact" }).eq("status", "sent").gte("created_at", dayAgo)),
      safeCount(sb.from("notification_delivery_logs").select("id", { head: true, count: "exact" }).eq("status", "failed").gte("created_at", dayAgo)),
      safeCount(sb.from("notification_delivery_logs").select("id", { head: true, count: "exact" }).eq("status", "pending")),
      safeCount(sb.from("api_webhook_subscriptions").select("id", { head: true, count: "exact" })),
      safeCount(sb.from("api_webhook_deliveries").select("id", { head: true, count: "exact" }).eq("status", "delivered").gte("created_at", dayAgo)),
      safeCount(sb.from("api_webhook_deliveries").select("id", { head: true, count: "exact" }).eq("status", "failed").gte("created_at", dayAgo)),
      safeCount(sb.from("api_webhook_deliveries").select("id", { head: true, count: "exact" }).in("status", ["pending", "retrying"])),
      safeCount(sb.from("ai_embeddings_queue").select("id", { head: true, count: "exact" }).eq("status", "pending")),
      safeCount(sb.from("ai_embeddings_queue").select("id", { head: true, count: "exact" }).eq("status", "failed")),
      safeCount(sb.from("ai_embeddings_queue").select("id", { head: true, count: "exact" }).eq("status", "dead")),
      safeCount(sb.from("ai_documents").select("id", { head: true, count: "exact" }).eq("embedding_status", "embedded")),
      safeCount(sb.from("ai_conversations").select("id", { head: true, count: "exact" }).gte("created_at", dayAgo)),
      safeCount(sb.from("ai_messages").select("id", { head: true, count: "exact" }).gte("created_at", dayAgo)),
      safeCount(sb.from("ai_conversations").select("id", { head: true, count: "exact" })),
      safeCount(sb.from("api_keys").select("id", { head: true, count: "exact" }).is("revoked_at", null)),
      safeCount(sb.from("api_key_usage").select("id", { head: true, count: "exact" }).gte("created_at", dayAgo)),
      safeCount(sb.from("api_key_usage").select("id", { head: true, count: "exact" }).gte("status_code", 400).gte("created_at", dayAgo)),
      safeCount(sb.from("system_errors").select("id", { head: true, count: "exact" }).gte("occurred_at", dayAgo)),
      safeCount(sb.from("system_errors").select("id", { head: true, count: "exact" }).eq("level", "error").gte("occurred_at", dayAgo)),
      safeCount(sb.from("security_events").select("id", { head: true, count: "exact" }).gte("created_at", dayAgo)),
    ]);

    const notifTotal = notifDelivered + notifFailed || 1;
    const hookTotal = hookDelivered + hookFailed || 1;
    const apiTotal = apiReqs || 1;
    const notifFailRate = Math.round((notifFailed / notifTotal) * 1000) / 10;
    const hookFailRate = Math.round((hookFailed / hookTotal) * 1000) / 10;
    const apiErrRate = Math.round((apiErrReqs / apiTotal) * 1000) / 10;

    let status: SystemHealth["status"] = "healthy";
    if (notifFailRate > 25 || hookFailRate > 25 || apiErrRate > 10 || ragDead > 50 || criticalErrors24 > 50) {
      status = "critical";
    } else if (notifFailRate > 5 || hookFailRate > 5 || apiErrRate > 2 || ragFailed > 10 || errors24 > 100) {
      status = "degraded";
    }

    return {
      generated_at: new Date().toISOString(),
      window_hours: 24,
      observability: obsResp.data ?? null,
      notifications: { delivered_24h: notifDelivered, failed_24h: notifFailed, pending: notifPending, failure_rate: notifFailRate },
      webhooks: { subscriptions: hookSubs, delivered_24h: hookDelivered, failed_24h: hookFailed, pending: hookPending, failure_rate: hookFailRate },
      rag: { queue_pending: ragPending, queue_failed: ragFailed, queue_dead: ragDead, embedded_docs: ragDocs },
      ai: { conversations_24h: aiConvs24, messages_24h: aiMsgs24, total_conversations: aiConvsTotal },
      api: { active_keys: apiKeys, requests_24h: apiReqs, error_requests_24h: apiErrReqs, error_rate: apiErrRate },
      errors: { total_24h: errors24, critical_24h: criticalErrors24 },
      security_events_24h: secEvents,
      status,
    };
  });
