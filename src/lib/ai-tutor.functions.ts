import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ACADEMY_SLUG = "academy";

const TUTOR_SYSTEM = `You are the HIGAET Academy AI Tutor.
- Help students understand programs, courses, lessons, assignments, and projects at HIGAET (Helen Institute of Gen AI Engineering & Technology).
- Use ONLY the provided knowledge context. If the context does not cover the question, say so and suggest the closest relevant topic from HIGAET.
- Cite sources inline as [1], [2], … matching the context items.
- For assignments: explain concepts, suggest a step-by-step approach, recommend resources. NEVER produce a finished graded submission for the student.
- Keep answers concise, structured, and learner-friendly.`;

export const askTutor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        prompt: z.string().min(1).max(4000),
        // Optional lesson/course/program context (for embedded "Ask about this lesson")
        lesson_id: z.string().uuid().optional(),
        course_id: z.string().uuid().optional(),
        program_id: z.string().uuid().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const t0 = Date.now();
    const sb = context.supabase;

    // Resolve Academy collection
    const { data: coll, error: cErr } = await sb
      .from("ai_collections")
      .select("id")
      .eq("slug", ACADEMY_SLUG)
      .maybeSingle();
    if (cErr) throw new Error(cErr.message);
    if (!coll) throw new Error("Academy collection not configured");

    // Build a context-enriched query (helps retrieval)
    let contextPrefix = "";
    if (data.lesson_id || data.course_id || data.program_id) {
      const parts: string[] = [];
      if (data.program_id) {
        const { data: p } = await sb.from("programs").select("title").eq("id", data.program_id).maybeSingle();
        if (p?.title) parts.push(`Program: ${p.title}`);
      }
      if (data.course_id) {
        const { data: c } = await sb.from("courses").select("title").eq("id", data.course_id).maybeSingle();
        if (c?.title) parts.push(`Course: ${c.title}`);
      }
      if (data.lesson_id) {
        const { data: l } = await sb.from("lessons").select("title").eq("id", data.lesson_id).maybeSingle();
        if (l?.title) parts.push(`Lesson: ${l.title}`);
      }
      if (parts.length) contextPrefix = parts.join(" · ") + "\n";
    }
    const enrichedQuery = contextPrefix + data.prompt;

    // Embed
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY missing");

    const embRes = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({ model: "openai/text-embedding-3-small", input: enrichedQuery }),
    });
    if (!embRes.ok) {
      const t = await embRes.text();
      throw new Error(`Embedding failed: ${embRes.status} ${t.slice(0, 200)}`);
    }
    const embJson = (await embRes.json()) as { data: { embedding: number[] }[] };
    const vec = embJson.data[0].embedding;

    // Retrieve from Academy only
    const { data: chunks, error: rErr } = await sb.rpc("match_ai_chunks", {
      query_embedding: vec as unknown as string,
      match_count: 8,
      collection_ids: [coll.id],
    });
    if (rErr) throw new Error(rErr.message);

    const contextText = (chunks ?? [])
      .map((c: any, i: number) => `[${i + 1}] ${c.chunk_text}`)
      .join("\n\n---\n\n");

    // Chat completion
    const chatRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        temperature: 0.3,
        messages: [
          { role: "system", content: TUTOR_SYSTEM },
          {
            role: "system",
            content: `Knowledge context (Academy):\n\n${contextText || "(no relevant context found — say you don't have specific HIGAET material on this topic)"}`,
          },
          ...(contextPrefix ? [{ role: "system", content: `Current student context: ${contextPrefix.trim()}` }] : []),
          { role: "user", content: data.prompt },
        ],
      }),
    });
    if (!chatRes.ok) {
      const t = await chatRes.text();
      throw new Error(`Tutor failed: ${chatRes.status} ${t.slice(0, 200)}`);
    }
    const chat = (await chatRes.json()) as any;
    const response = chat.choices?.[0]?.message?.content ?? "";
    const latency = Date.now() - t0;

    // Log (best-effort)
    try {
      await sb.from("ai_conversation_logs").insert({
        user_id: context.userId,
        prompt: data.prompt,
        response,
        retrieved_chunk_ids: (chunks ?? []).map((c: any) => c.id),
        model: "google/gemini-3-flash-preview",
        prompt_tokens: chat.usage?.prompt_tokens ?? null,
        completion_tokens: chat.usage?.completion_tokens ?? null,
        latency_ms: latency,
      });
    } catch {
      // ignore log failure
    }

    return {
      response,
      sources: (chunks ?? []).map((c: any, i: number) => ({
        index: i + 1,
        id: c.id,
        similarity: Number(c.similarity),
        snippet: String(c.chunk_text).slice(0, 280),
        metadata: c.metadata ?? {},
      })),
      latency_ms: latency,
    };
  });
