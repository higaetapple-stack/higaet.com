// Phase 7.2 RAG — embedding helpers.
// Phase 1.12: OpenRouter fallback added (same 1536-dim model, dimension-compatible).
// Server-only. Vector column: public.ai_chunks.embedding vector(1536).

import { aiEmbeddings, splitModelId } from "@/lib/ai-gateway.server";

export const EMBEDDING_MODEL = "openai/text-embedding-3-small";
export const EMBEDDING_FALLBACK_MODEL = "openrouter/openai/text-embedding-3-small";
export const EMBEDDING_DIMS = 1536;

const EMBEDDING_CHAIN = [EMBEDDING_MODEL, EMBEDDING_FALLBACK_MODEL] as const;

async function callEmbedModel(model: string, inputs: string[]): Promise<number[][]> {
  const res = await aiEmbeddings({ model, input: inputs });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const err = new Error(`embed ${model} ${res.status}: ${text.slice(0, 300)}`);
    (err as Error & { status?: number }).status = res.status;
    throw err;
  }
  const json = (await res.json()) as { data: Array<{ embedding: number[]; index: number }> };
  const out: number[][] = new Array(inputs.length);
  for (const item of json.data) out[item.index] = item.embedding;
  return out;
}

async function logEmbedTelemetry(opts: {
  model: string;
  attempt: number;
  outcome: "success" | "fallback" | "failure";
  latency_ms: number;
  tokens_in: number;
  error_code?: string;
}) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { provider, model } = splitModelId(opts.model);
    await supabaseAdmin.from("ai_usage").insert({
      consumer: "embeddings",
      logical_id: "embed.small",
      provider,
      model,
      attempt: opts.attempt,
      outcome: opts.outcome,
      tokens_in: opts.tokens_in,
      tokens_out: 0,
      latency_ms: opts.latency_ms,
      error_code: opts.error_code ?? null,
    });
  } catch {
    // Telemetry must never break ingest/query.
  }
}

// `apiKey` arg kept for back-compat; ignored.
export async function embedTexts(_apiKey: string | undefined, inputs: string[]): Promise<number[][]> {
  if (inputs.length === 0) return [];
  const tokens_in = inputs.reduce((s, t) => s + Math.ceil(t.length / 4), 0);
  let lastErr: unknown;
  for (let i = 0; i < EMBEDDING_CHAIN.length; i++) {
    const model = EMBEDDING_CHAIN[i];
    const start = Date.now();
    try {
      const vectors = await callEmbedModel(model, inputs);
      if (vectors[0]?.length && vectors[0].length !== EMBEDDING_DIMS) {
        throw new Error(`dim mismatch: got ${vectors[0].length}, expected ${EMBEDDING_DIMS}`);
      }
      void logEmbedTelemetry({
        model,
        attempt: i + 1,
        outcome: i === 0 ? "success" : "fallback",
        latency_ms: Date.now() - start,
        tokens_in,
      });
      return vectors;
    } catch (e) {
      lastErr = e;
      const status = (e as Error & { status?: number })?.status;
      void logEmbedTelemetry({
        model,
        attempt: i + 1,
        outcome: "failure",
        latency_ms: Date.now() - start,
        tokens_in,
        error_code: status ? String(status) : (e as Error).message.slice(0, 60),
      });
      // Bail on client errors (except 429); retry on 429/5xx/network.
      if (status && status !== 429 && status >= 400 && status < 500) throw e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("embedTexts: all providers failed");
}

// Format a number[] as pgvector literal: "[0.1,0.2,...]"
export function toVectorLiteral(v: number[]): string {
  return `[${v.join(",")}]`;
}

// Naive char-based chunker with overlap. Adequate for prose/markdown.
export function chunkText(text: string, size = 900, overlap = 150): string[] {
  const clean = text.replace(/\r\n/g, "\n").trim();
  if (clean.length <= size) return clean ? [clean] : [];
  const out: string[] = [];
  let i = 0;
  while (i < clean.length) {
    const end = Math.min(i + size, clean.length);
    let slice = clean.slice(i, end);
    if (end < clean.length) {
      const lastBreak = Math.max(
        slice.lastIndexOf("\n\n"),
        slice.lastIndexOf(". "),
        slice.lastIndexOf("\n"),
      );
      if (lastBreak > size * 0.5) slice = slice.slice(0, lastBreak);
    }
    out.push(slice.trim());
    i += slice.length - overlap;
    if (i < 0) i = end;
  }
  return out.filter((c) => c.length > 0);
}
