import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { aiChatCompletion, aiEmbeddings } from "@/lib/ai-gateway.server";

const GLOBAL_SLUG = "global-education";

const ADVISOR_SYSTEM = `You are the HIGAET Study Abroad Advisor.
- Help prospective students explore countries, universities, programs, scholarships, applications, and visa pathways supported by HIGAET Global Education Hub.
- Use ONLY the provided knowledge context. If the context does not cover the question, say so clearly and recommend the closest relevant HIGAET resource or suggest contacting a HIGAET counselor.
- Cite sources inline as [1], [2], … matching the context items.
- Be specific and structured: when comparing options, use short bullet lists for eligibility, fees, deadlines, and scholarships.
- This guidance is informational only. NEVER provide legal advice, NEVER guarantee admission, scholarships, or visa outcomes. For visa or immigration specifics, recommend consulting a licensed immigration consultant or the official embassy.`;

export const askAdvisor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        prompt: z.string().min(1).max(4000),
        country_id: z.string().uuid().optional(),
        university_id: z.string().uuid().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const t0 = Date.now();
    const sb = context.supabase;

    const { data: coll, error: cErr } = await sb
      .from("ai_collections")
      .select("id")
      .eq("slug", GLOBAL_SLUG)
      .maybeSingle();
    if (cErr) throw new Error(cErr.message);
    if (!coll) throw new Error("Global Education collection not configured");

    let contextPrefix = "";
    if (data.country_id || data.university_id) {
      const parts: string[] = [];
      if (data.country_id) {
        const { data: c } = await sb.from("countries").select("name").eq("id", data.country_id).maybeSingle();
        if (c?.name) parts.push(`Country: ${c.name}`);
      }
      if (data.university_id) {
        const { data: u } = await sb.from("universities").select("name").eq("id", data.university_id).maybeSingle();
        if (u?.name) parts.push(`University: ${u.name}`);
      }
      if (parts.length) contextPrefix = parts.join(" · ") + "\n";
    }
    const enrichedQuery = contextPrefix + data.prompt;

    const embRes = await aiEmbeddings({ model: "openai/text-embedding-3-small", input: enrichedQuery });
    if (!embRes.ok) {
      const t = await embRes.text();
      throw new Error(`Embedding failed: ${embRes.status} ${t.slice(0, 200)}`);
    }
    const embJson = (await embRes.json()) as { data: { embedding: number[] }[] };
    const vec = embJson.data[0].embedding;

    const { data: chunks, error: rErr } = await sb.rpc("match_ai_chunks", {
      query_embedding: vec as unknown as string,
      match_count: 10,
      collection_ids: [coll.id],
    });
    if (rErr) throw new Error(rErr.message);

    const contextText = (chunks ?? [])
      .map((c: any, i: number) => `[${i + 1}] ${c.chunk_text}`)
      .join("\n\n---\n\n");

    const chatRes = await aiChatCompletion({
      model: "google/gemini-3-flash-preview",
      temperature: 0.3,
      messages: [
        { role: "system", content: ADVISOR_SYSTEM },
        {
          role: "system",
          content: `Knowledge context (Global Education):\n\n${contextText || "(no relevant context found — say you don't have specific HIGAET material on this topic and recommend speaking with a counselor)"}`,
        },
        ...(contextPrefix ? [{ role: "system" as const, content: `Current student context: ${contextPrefix.trim()}` }] : []),
        { role: "user", content: data.prompt },
      ],
    });
    if (!chatRes.ok) {
      const t = await chatRes.text();
      throw new Error(`Advisor failed: ${chatRes.status} ${t.slice(0, 200)}`);
    }
    const chat = (await chatRes.json()) as any;
    const response = chat.choices?.[0]?.message?.content ?? "";
    const latency = Date.now() - t0;

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

export const listAdvisorExplorers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase;
    const [countriesRes, universitiesRes, scholarshipsRes] = await Promise.all([
      sb.from("countries").select("id, name, slug").order("name").limit(24),
      sb.from("universities").select("id, name, slug, country_id").order("name").limit(24),
      sb.from("scholarships").select("id, name, amount, country_id").order("name").limit(24),
    ]);
    return {
      countries: countriesRes.data ?? [],
      universities: universitiesRes.data ?? [],
      scholarships: scholarshipsRes.data ?? [],
    };
  });
