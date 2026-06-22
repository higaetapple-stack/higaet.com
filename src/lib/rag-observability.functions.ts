// Phase 7.2 RAG observability — admin-only metrics for the embedding pipeline.
// Surfaces queue health, retry rate, dead-letter size, throughput, and per-entity chunk coverage.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const [admin, superAdmin] = await Promise.all([
    ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" }),
    ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "super_admin" }),
  ]);
  if (!(admin.data || superAdmin.data)) throw new Error("Forbidden");
}

export interface RagStats {
  queue: { pending: number; processing: number; failed: number; dead: number; completed_24h: number };
  retry_rate_24h: number; // failed_attempts / total_attempts
  throughput: { last_hour: number; last_24h: number };
  avg_latency_ms_24h: number | null;
  documents: { lesson: number; thread: number; pending_embedding: number };
  chunks: { total: number; avg_per_lesson: number; avg_per_thread: number };
  top_failing: Array<{ document_id: string; entity_type: string | null; title: string | null; attempts: number; last_error: string | null }>;
  recent: Array<{ entity_type: string; title: string | null; chunk_count: number; embedded_at: string | null }>;
}

export const getRagStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const now = Date.now();
    const hourAgo = new Date(now - 60 * 60 * 1000).toISOString();
    const dayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();

    const countBy = async (status: string) => {
      const { count } = await supabaseAdmin
        .from("ai_embeddings_queue")
        .select("id", { head: true, count: "exact" })
        .eq("status", status);
      return count ?? 0;
    };

    const [pending, processing, failed, dead] = await Promise.all([
      countBy("pending"), countBy("processing"), countBy("failed"), countBy("dead"),
    ]);

    const { count: completed24 } = await supabaseAdmin
      .from("ai_embeddings_queue")
      .select("id", { head: true, count: "exact" })
      .eq("status", "completed")
      .gte("processed_at", dayAgo);

    const { count: lastHour } = await supabaseAdmin
      .from("ai_embeddings_queue")
      .select("id", { head: true, count: "exact" })
      .eq("status", "completed")
      .gte("processed_at", hourAgo);

    // Retry rate over the last 24h (attempts on rows touched recently)
    const { data: attemptsRows } = await supabaseAdmin
      .from("ai_embeddings_queue")
      .select("attempts, status")
      .gte("updated_at", dayAgo)
      .limit(2000);
    const totalAttempts = (attemptsRows ?? []).reduce((s, r) => s + (r.attempts ?? 0), 0);
    const failedAttempts = (attemptsRows ?? []).reduce(
      (s, r) => s + Math.max((r.attempts ?? 0) - (r.status === "completed" ? 1 : 0), 0),
      0,
    );
    const retryRate = totalAttempts > 0 ? failedAttempts / totalAttempts : 0;

    // Latency: processed_at - created_at on completed rows in the last 24h
    const { data: latencyRows } = await supabaseAdmin
      .from("ai_embeddings_queue")
      .select("created_at, processed_at")
      .eq("status", "completed")
      .gte("processed_at", dayAgo)
      .limit(500);
    const latencies = (latencyRows ?? [])
      .map((r) => (r.processed_at && r.created_at
        ? new Date(r.processed_at).getTime() - new Date(r.created_at).getTime()
        : null))
      .filter((n): n is number => typeof n === "number" && n >= 0);
    const avgLatency = latencies.length > 0
      ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
      : null;

    const countDocs = async (entity_type: string) => {
      const { count } = await supabaseAdmin
        .from("ai_documents")
        .select("id", { head: true, count: "exact" })
        .eq("entity_type", entity_type);
      return count ?? 0;
    };
    const [lessonDocs, threadDocs] = await Promise.all([countDocs("lesson"), countDocs("thread")]);
    const { count: pendingDocs } = await supabaseAdmin
      .from("ai_documents")
      .select("id", { head: true, count: "exact" })
      .neq("embedding_status", "completed");

    const { count: totalChunks } = await supabaseAdmin
      .from("ai_chunks")
      .select("id", { head: true, count: "exact" });

    // Avg chunks per entity type via simple aggregation
    const { data: chunkAggRows } = await supabaseAdmin
      .from("ai_chunks")
      .select("document_id, ai_documents!inner(entity_type)")
      .limit(5000);
    const perDoc = new Map<string, string>();
    const docCount = new Map<string, number>();
    for (const r of (chunkAggRows ?? []) as Array<{ document_id: string; ai_documents: { entity_type: string } }>) {
      perDoc.set(r.document_id, r.ai_documents.entity_type);
      docCount.set(r.document_id, (docCount.get(r.document_id) ?? 0) + 1);
    }
    let lessonChunks = 0, lessonDocsSeen = 0, threadChunks = 0, threadDocsSeen = 0;
    for (const [docId, type] of perDoc) {
      const c = docCount.get(docId) ?? 0;
      if (type === "lesson") { lessonChunks += c; lessonDocsSeen += 1; }
      else if (type === "thread") { threadChunks += c; threadDocsSeen += 1; }
    }

    // Top failing queue items
    const { data: failingRows } = await supabaseAdmin
      .from("ai_embeddings_queue")
      .select("document_id, attempts, last_error, status")
      .in("status", ["failed", "dead"])
      .order("attempts", { ascending: false })
      .limit(8);
    const failingIds = (failingRows ?? []).map((r) => r.document_id).filter(Boolean) as string[];
    const failingDocs = failingIds.length
      ? (await supabaseAdmin.from("ai_documents").select("id, entity_type, title").in("id", failingIds)).data ?? []
      : [];
    const docMap = new Map(failingDocs.map((d) => [d.id, d]));
    const topFailing = (failingRows ?? []).map((r) => ({
      document_id: r.document_id ?? "",
      entity_type: r.document_id ? docMap.get(r.document_id)?.entity_type ?? null : null,
      title: r.document_id ? docMap.get(r.document_id)?.title ?? null : null,
      attempts: r.attempts ?? 0,
      last_error: r.last_error ?? null,
    }));

    // Recently embedded items
    const { data: recentRows } = await supabaseAdmin
      .from("ai_chunks")
      .select("document_id, embedded_at, ai_documents!inner(entity_type, title)")
      .order("embedded_at", { ascending: false })
      .limit(10);
    const recent = ((recentRows ?? []) as Array<{ document_id: string; embedded_at: string | null; ai_documents: { entity_type: string; title: string | null } }>).map((r) => ({
      entity_type: r.ai_documents.entity_type,
      title: r.ai_documents.title,
      chunk_count: docCount.get(r.document_id) ?? 1,
      embedded_at: r.embedded_at,
    }));

    const stats: RagStats = {
      queue: { pending, processing, failed, dead, completed_24h: completed24 ?? 0 },
      retry_rate_24h: Number(retryRate.toFixed(3)),
      throughput: { last_hour: lastHour ?? 0, last_24h: completed24 ?? 0 },
      avg_latency_ms_24h: avgLatency,
      documents: { lesson: lessonDocs, thread: threadDocs, pending_embedding: pendingDocs ?? 0 },
      chunks: {
        total: totalChunks ?? 0,
        avg_per_lesson: lessonDocsSeen > 0 ? Math.round((lessonChunks / lessonDocsSeen) * 10) / 10 : 0,
        avg_per_thread: threadDocsSeen > 0 ? Math.round((threadChunks / threadDocsSeen) * 10) / 10 : 0,
      },
      top_failing: topFailing,
      recent,
    };
    return stats;
  });

// Manual worker trigger (admin) — useful for draining the queue without waiting on cron.
export const drainEmbeddingsNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const apikey = process.env.SUPABASE_PUBLISHABLE_KEY;
    const base = process.env.LOVABLE_APP_URL
      ?? `https://project--019358d1-d5d3-491a-8f03-bd2f647a26b3.lovable.app`;
    const res = await fetch(`${base}/api/public/cron/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: apikey ?? "" },
      body: "{}",
    });
    const text = await res.text();
    return { status: res.status, body: text.slice(0, 500) };
  });

// Re-enqueue all dead-letter rows for retry.
export const requeueDeadLetters = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("ai_embeddings_queue")
      .update({ status: "pending", attempts: 0, last_error: null, scheduled_for: new Date().toISOString() })
      .eq("status", "dead")
      .select("id");
    if (error) throw new Error(error.message);
    return { requeued: data?.length ?? 0 };
  });
