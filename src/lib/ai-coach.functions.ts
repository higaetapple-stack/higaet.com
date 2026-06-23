import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { aiChatCompletion, aiEmbeddings } from "@/lib/ai-gateway.server";

const CAREER_SLUG = "career";

const COACH_SYSTEM = `You are the HIGAET Career Coach.
- Help learners and alumni grow into AI-era careers using HIGAET programs, courses, certificates, projects, portfolios, jobs, placements, and success stories.
- Use ONLY the provided knowledge context for HIGAET-specific facts (programs, certificates, jobs, placement data). For general career best practices, you may add concise, widely accepted guidance, but never invent HIGAET specifics.
- Cite HIGAET context inline as [1], [2], …
- Be structured: use short headings and bullet lists for resume feedback, roadmaps, interview prep, and job-fit analyses.
- Coach, don't ghostwrite: for resume review, give actionable rewrite suggestions, not a finished resume. For interviews, give example answers as illustrations, not scripts to memorise.
- Never guarantee jobs, salaries, placements, or visa outcomes. Recommend speaking with a HIGAET counselor for personalised placement planning.`;

const MODE_HINTS: Record<string, string> = {
  resume_review:
    "Mode: Resume Review. Evaluate the candidate's resume across: relevance to target role, skills coverage, keyword match, formatting & clarity, quantified impact, project depth, and experience gaps. Return: Strengths, Gaps, Rewrite Suggestions (3-5 bullet examples), Recommended HIGAET assets to add.",
  roadmap:
    "Mode: Career Roadmap. Build a 3-6 month roadmap using HIGAET programs, courses, projects, certificates. Structure: Stage 1 Foundations · Stage 2 Build · Stage 3 Portfolio · Stage 4 Job Prep. Include weekly time estimate.",
  portfolio:
    "Mode: Portfolio Coaching. Review the projects/portfolio the learner shares. Suggest stronger project framing, README structure, deployment, metrics, and which HIGAET capstone projects would strengthen it.",
  interview:
    "Mode: Interview Prep. Generate 5-8 practice questions tailored to the role, with brief model-answer outlines (not full scripts), plus 1-2 hands-on practice tasks.",
  job_fit:
    "Mode: Job Readiness. Compare the candidate profile to the job description. Return: Match %, Matching Skills, Skill Gaps, Recommended Learning (map to HIGAET courses/certs), and a 2-4 week prep plan.",
  general: "Mode: General career coaching.",
};

export const askCoach = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        prompt: z.string().min(1).max(8000),
        mode: z
          .enum(["resume_review", "roadmap", "portfolio", "interview", "job_fit", "general"])
          .default("general"),
        target_role: z.string().max(200).optional(),
        resume_text: z.string().max(12000).optional(),
        job_description: z.string().max(12000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const t0 = Date.now();
    const sb = context.supabase;

    const { data: coll, error: cErr } = await sb
      .from("ai_collections")
      .select("id")
      .eq("slug", CAREER_SLUG)
      .maybeSingle();
    if (cErr) throw new Error(cErr.message);
    if (!coll) throw new Error("Career collection not configured");

    const enrichedQuery = [
      data.target_role ? `Target role: ${data.target_role}` : "",
      data.prompt,
      data.resume_text ? `\nResume excerpt:\n${data.resume_text.slice(0, 2000)}` : "",
      data.job_description ? `\nJob description excerpt:\n${data.job_description.slice(0, 2000)}` : "",
    ]
      .filter(Boolean)
      .join("\n");

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

    const userBlock = [
      data.target_role ? `Target role: ${data.target_role}` : null,
      data.resume_text ? `\n--- RESUME ---\n${data.resume_text}` : null,
      data.job_description ? `\n--- JOB DESCRIPTION ---\n${data.job_description}` : null,
      `\n--- REQUEST ---\n${data.prompt}`,
    ]
      .filter(Boolean)
      .join("\n");

    const chatRes = await aiChatCompletion({
      model: "google/gemini-3-flash-preview",
      temperature: 0.3,
      messages: [
        { role: "system", content: COACH_SYSTEM },
        { role: "system", content: MODE_HINTS[data.mode] ?? MODE_HINTS.general },
        {
          role: "system",
          content: `Knowledge context (Career):\n\n${contextText || "(no specific HIGAET context retrieved — rely on widely accepted career best practices and recommend a HIGAET counselor)"}`,
        },
        { role: "user", content: userBlock },
      ],
    });
    if (!chatRes.ok) {
      const t = await chatRes.text();
      throw new Error(`Coach failed: ${chatRes.status} ${t.slice(0, 200)}`);
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
