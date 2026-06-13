import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ADMIN_ROLES = ["admin", "super_admin"] as const;

async function isAdmin(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.rpc("has_any_role", {
    _user_id: ctx.userId,
    _roles: ADMIN_ROLES as unknown as string[],
  });
  return !!data;
}
async function assertAdmin(ctx: { supabase: any; userId: string }) {
  if (!(await isAdmin(ctx))) throw new Error("Forbidden");
}

// ---------- Collections ----------
export const listCollections = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("ai_collections")
      .select("*")
      .order("name");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertCollection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        slug: z.string().min(2),
        name: z.string().min(2),
        description: z.string().optional().nullable(),
        is_active: z.boolean().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: row, error } = await context.supabase
      .from("ai_collections")
      .upsert(data, { onConflict: "slug" })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

// ---------- Ingestion ----------
export const ingestDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        collection_id: z.string().uuid(),
        title: z.string().min(1),
        content: z.string().min(1),
        metadata: z.record(z.string(), z.any()).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { chunkText } = await import("@/lib/ai-knowledge.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: doc, error: docErr } = await supabaseAdmin
      .from("ai_documents")
      .insert({
        collection_id: data.collection_id,
        title: data.title,
        content: data.content,
        metadata: data.metadata ?? {},
        chunk_status: "chunking",
      })
      .select()
      .single();
    if (docErr) throw new Error(docErr.message);

    const pieces = chunkText(data.content);
    if (pieces.length === 0) {
      await supabaseAdmin.from("ai_documents").update({ chunk_status: "empty" }).eq("id", doc.id);
      return { document_id: doc.id, chunks: 0 };
    }

    const rows = pieces.map((p) => ({
      document_id: doc.id,
      collection_id: data.collection_id,
      chunk_order: p.order,
      chunk_text: p.text,
      token_count: p.tokenCount,
      metadata: { ...(data.metadata ?? {}), title: data.title },
      embedding_status: "pending",
    }));
    const { error: chErr } = await supabaseAdmin.from("ai_chunks").insert(rows);
    if (chErr) throw new Error(chErr.message);

    await supabaseAdmin.from("ai_documents").update({ chunk_status: "chunked" }).eq("id", doc.id);
    return { document_id: doc.id, chunks: rows.length };
  });

// ---------- Embedding worker ----------
export const processEmbeddingQueue = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ batch: z.number().int().min(1).max(50).default(10) }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { embedText } = await import("@/lib/ai-knowledge.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: pending, error } = await supabaseAdmin
      .from("ai_chunks")
      .select("id, chunk_text")
      .eq("embedding_status", "pending")
      .limit(data.batch);
    if (error) throw new Error(error.message);
    if (!pending || pending.length === 0) return { processed: 0, failed: 0 };

    let ok = 0;
    let failed = 0;
    for (const row of pending) {
      try {
        const vec = await embedText(row.chunk_text as string);
        const { error: upErr } = await supabaseAdmin
          .from("ai_chunks")
          .update({
            embedding: vec as unknown as string,
            embedding_status: "embedded",
            embedded_at: new Date().toISOString(),
          })
          .eq("id", row.id);
        if (upErr) throw upErr;
        ok++;
      } catch (e: any) {
        failed++;
        await supabaseAdmin
          .from("ai_chunks")
          .update({ embedding_status: "failed", metadata: { error: String(e?.message ?? e) } })
          .eq("id", row.id);
      }
    }
    return { processed: ok, failed };
  });

// ---------- Retrieval ----------
export const searchKnowledge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        query: z.string().min(1),
        collection_ids: z.array(z.string().uuid()).optional(),
        match_count: z.number().int().min(1).max(20).default(8),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { embedText } = await import("@/lib/ai-knowledge.server");
    const t0 = Date.now();
    const vec = await embedText(data.query);
    const { data: matches, error } = await context.supabase.rpc("match_ai_chunks", {
      query_embedding: vec as unknown as string,
      match_count: data.match_count,
      collection_ids: data.collection_ids ?? null,
    });
    if (error) throw new Error(error.message);
    return { matches: matches ?? [], latency_ms: Date.now() - t0 };
  });

// ---------- Agent configs ----------
export const listAgents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("ai_agent_configs")
      .select("*")
      .order("name");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertAgent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        slug: z.string().min(2),
        name: z.string().min(2),
        description: z.string().optional().nullable(),
        system_prompt: z.string().min(1),
        model: z.string().default("google/gemini-3-flash-preview"),
        temperature: z.number().min(0).max(2).default(0.3),
        collection_ids: z.array(z.string().uuid()).default([]),
        max_chunks: z.number().int().min(1).max(20).default(8),
        enabled: z.boolean().default(true),
        visibility: z.enum(["admin", "authenticated", "public"]).default("admin"),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: row, error } = await context.supabase
      .from("ai_agent_configs")
      .upsert(data, { onConflict: "slug" })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

// ---------- Playground: retrieval + chat completion ----------
export const runAgent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ agent_id: z.string().uuid(), prompt: z.string().min(1) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const t0 = Date.now();
    const { embedText } = await import("@/lib/ai-knowledge.server");

    const { data: agent, error: aErr } = await context.supabase
      .from("ai_agent_configs")
      .select("*")
      .eq("id", data.agent_id)
      .single();
    if (aErr) throw new Error(aErr.message);
    if (!agent.enabled) throw new Error("Agent disabled");

    const vec = await embedText(data.prompt);
    const { data: chunks, error: rErr } = await context.supabase.rpc("match_ai_chunks", {
      query_embedding: vec as unknown as string,
      match_count: agent.max_chunks,
      collection_ids: agent.collection_ids?.length ? agent.collection_ids : null,
    });
    if (rErr) throw new Error(rErr.message);

    const contextText = (chunks ?? [])
      .map((c: any, i: number) => `[${i + 1}] ${c.chunk_text}`)
      .join("\n\n---\n\n");

    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY missing");

    const chatRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: agent.model,
        temperature: Number(agent.temperature),
        messages: [
          { role: "system", content: agent.system_prompt },
          {
            role: "system",
            content: `Use ONLY the following knowledge context. Cite sources as [n]. If unknown, say so.\n\n${contextText || "(no context)"}`,
          },
          { role: "user", content: data.prompt },
        ],
      }),
    });
    if (!chatRes.ok) {
      const t = await chatRes.text();
      throw new Error(`Chat failed: ${chatRes.status} ${t.slice(0, 300)}`);
    }
    const chat = (await chatRes.json()) as any;
    const response = chat.choices?.[0]?.message?.content ?? "";
    const latency = Date.now() - t0;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("ai_conversation_logs").insert({
      agent_id: agent.id,
      user_id: context.userId,
      prompt: data.prompt,
      response,
      retrieved_chunk_ids: (chunks ?? []).map((c: any) => c.id),
      model: agent.model,
      prompt_tokens: chat.usage?.prompt_tokens ?? null,
      completion_tokens: chat.usage?.completion_tokens ?? null,
      latency_ms: latency,
    });

    return { response, chunks: chunks ?? [], latency_ms: latency };
  });

// ---------- KPIs ----------
export const knowledgeKpis = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    const [{ count: collections }, { count: documents }, { count: chunks }, { count: pending }, { count: failed }, { count: agents }] = await Promise.all([
      sb.from("ai_collections").select("*", { count: "exact", head: true }),
      sb.from("ai_documents").select("*", { count: "exact", head: true }),
      sb.from("ai_chunks").select("*", { count: "exact", head: true }),
      sb.from("ai_chunks").select("*", { count: "exact", head: true }).eq("embedding_status", "pending"),
      sb.from("ai_chunks").select("*", { count: "exact", head: true }).eq("embedding_status", "failed"),
      sb.from("ai_agent_configs").select("*", { count: "exact", head: true }),
    ]);
    return {
      collections: collections ?? 0,
      documents: documents ?? 0,
      chunks: chunks ?? 0,
      pending_embeddings: pending ?? 0,
      failed_embeddings: failed ?? 0,
      agents: agents ?? 0,
    };
  });
