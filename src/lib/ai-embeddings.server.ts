// Phase 7.2 RAG — embedding helpers.
// Server-only. Calls OpenAI directly via the shared provider router.
// Uses openai/text-embedding-3-small (1536 dims) to match public.ai_chunks.embedding column.

import { aiEmbeddings } from "@/lib/ai-gateway.server";

export const EMBEDDING_MODEL = "openai/text-embedding-3-small";
export const EMBEDDING_DIMS = 1536;

// `apiKey` arg kept for back-compat; ignored. Direct providers read OPENAI_API_KEY/GEMINI_API_KEY from env.
export async function embedTexts(_apiKey: string | undefined, inputs: string[]): Promise<number[][]> {
  if (inputs.length === 0) return [];
  const res = await aiEmbeddings({ model: EMBEDDING_MODEL, input: inputs });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`embedTexts ${res.status}: ${text.slice(0, 500)}`);
  }
  const json = (await res.json()) as { data: Array<{ embedding: number[]; index: number }> };
  const out: number[][] = new Array(inputs.length);
  for (const item of json.data) out[item.index] = item.embedding;
  return out;
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
