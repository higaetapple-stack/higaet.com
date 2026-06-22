// Phase 10B — AI Hub server functions.
// Public collection health + admin usage metrics. Per-user conversation
// helpers reuse ai-chat.functions.ts (createConversation, listConversations,
// deleteConversation, getConversation).

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

interface CollectionMetrics {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  documents: number;
  chunks: number;
  pending_embeddings: number;
  failed_embeddings: number;
  last_indexed_at: string | null;
}

// Public — anyone can browse the AI knowledge surface.
export const getCollectionsHealth = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CollectionMetrics[]> => {
    const sb = context.supabase;
    const { data: collections, error } = await sb
      .from("ai_collections")
      .select("id, slug, name, description, is_active")
      .eq("is_active", true)
      .order("name");
    if (error) throw new Error(error.message);

    const out: CollectionMetrics[] = [];
    for (const c of collections ?? []) {
      const [docs, chunks, pending, failed, latest] = await Promise.all([
        sb.from("ai_documents").select("*", { count: "exact", head: true }).eq("collection_id", c.id),
        sb.from("ai_chunks").select("*", { count: "exact", head: true }).eq("collection_id", c.id),
        sb.from("ai_chunks").select("*", { count: "exact", head: true }).eq("collection_id", c.id).eq("embedding_status", "pending"),
        sb.from("ai_chunks").select("*", { count: "exact", head: true }).eq("collection_id", c.id).eq("embedding_status", "failed"),
        sb.from("ai_documents").select("updated_at").eq("collection_id", c.id).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
      ]);
      out.push({
        id: c.id,
        slug: c.slug,
        name: c.name,
        description: c.description,
        documents: docs.count ?? 0,
        chunks: chunks.count ?? 0,
        pending_embeddings: pending.count ?? 0,
        failed_embeddings: failed.count ?? 0,
        last_indexed_at: (latest.data as { updated_at?: string } | null)?.updated_at ?? null,
      });
    }
    return out;
  });

export const getCollectionDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ slug: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const { data: collection, error } = await sb
      .from("ai_collections")
      .select("*")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!collection) throw new Error("Collection not found");

    const { data: documents } = await sb
      .from("ai_documents")
      .select("id, title, source_type, updated_at")
      .eq("collection_id", collection.id)
      .order("updated_at", { ascending: false })
      .limit(20);

    return { collection, documents: documents ?? [] };
  });

// Admin-only usage dashboard data.
async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

export const getAiUsageMetrics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ days: z.number().int().min(1).max(90).default(14) }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    const since = new Date(Date.now() - data.days * 86400_000).toISOString();

    const [convs, msgs, logs] = await Promise.all([
      sb.from("ai_conversations").select("id, created_at, context_type, context_id").gte("created_at", since),
      sb.from("ai_messages").select("id, created_at, role").gte("created_at", since),
      sb.from("ai_conversation_logs").select("created_at, latency_ms, error, retrieved_chunk_ids, prompt").gte("created_at", since),
    ]);

    if (convs.error) throw new Error(convs.error.message);
    if (msgs.error) throw new Error(msgs.error.message);
    if (logs.error) throw new Error(logs.error.message);

    const convRows = convs.data ?? [];
    const msgRows = msgs.data ?? [];
    const logRows = logs.data ?? [];

    // Bucket by day
    const dayBuckets = new Map<string, { conversations: number; messages: number }>();
    const ensure = (d: string) => {
      if (!dayBuckets.has(d)) dayBuckets.set(d, { conversations: 0, messages: 0 });
      return dayBuckets.get(d)!;
    };
    for (const c of convRows) ensure(c.created_at.slice(0, 10)).conversations++;
    for (const m of msgRows) ensure(m.created_at.slice(0, 10)).messages++;
    const series = Array.from(dayBuckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, v]) => ({ day, ...v }));

    // Retrieval health
    let hits = 0;
    let misses = 0;
    let totalLatency = 0;
    let latencyCount = 0;
    let failed = 0;
    const promptCounts = new Map<string, number>();
    for (const l of logRows) {
      const retrieved = Array.isArray(l.retrieved_chunk_ids) ? l.retrieved_chunk_ids.length : 0;
      if (retrieved > 0) hits++;
      else misses++;
      if (typeof l.latency_ms === "number") {
        totalLatency += l.latency_ms;
        latencyCount++;
      }
      if (l.error) failed++;
      const head = (l.prompt ?? "").slice(0, 80);
      if (head) promptCounts.set(head, (promptCounts.get(head) ?? 0) + 1);
    }
    const topPrompts = Array.from(promptCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([prompt, count]) => ({ prompt, count }));

    // Most-queried contexts
    const lessonCounts = new Map<string, number>();
    const communityCounts = new Map<string, number>();
    for (const c of convRows) {
      if (!c.context_id) continue;
      if (c.context_type === "lesson") lessonCounts.set(c.context_id, (lessonCounts.get(c.context_id) ?? 0) + 1);
      if (c.context_type === "community") communityCounts.set(c.context_id, (communityCounts.get(c.context_id) ?? 0) + 1);
    }
    const top = (m: Map<string, number>) =>
      Array.from(m.entries()).sort(([, a], [, b]) => b - a).slice(0, 10).map(([id, count]) => ({ id, count }));

    return {
      windowDays: data.days,
      totals: {
        conversations: convRows.length,
        messages: msgRows.length,
        retrieval_hits: hits,
        retrieval_misses: misses,
        failed_generations: failed,
        avg_latency_ms: latencyCount ? Math.round(totalLatency / latencyCount) : 0,
      },
      series,
      topPrompts,
      topLessons: top(lessonCounts),
      topCommunities: top(communityCounts),
    };
  });
