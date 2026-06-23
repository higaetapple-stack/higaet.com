// Server-only helpers for the Knowledge Intelligence Platform (Sprint 6A).
// - Embedding via direct OpenAI (routed through shared provider helper).
// - Naive but effective paragraph/sentence chunking.

import { aiEmbeddings } from "@/lib/ai-gateway.server";

const EMBEDDING_MODEL = "openai/text-embedding-3-small"; // 1536 dims, matches vector(1536) column

export async function embedText(input: string): Promise<number[]> {
  const res = await aiEmbeddings({ model: EMBEDDING_MODEL, input });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Embedding failed: ${res.status} ${text.slice(0, 300)}`);
  }
  const json = (await res.json()) as { data: { embedding: number[] }[] };
  return json.data[0].embedding;
}

export interface ChunkPiece {
  text: string;
  order: number;
  tokenCount: number;
}

/** Approx 1 token ~= 4 chars. Splits on paragraph boundaries with overlap. */
export function chunkText(input: string, opts?: { targetChars?: number; overlapChars?: number }): ChunkPiece[] {
  const target = opts?.targetChars ?? 1200;
  const overlap = opts?.overlapChars ?? 150;
  const clean = (input ?? "").replace(/\r\n/g, "\n").trim();
  if (!clean) return [];

  const paras = clean.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let buf = "";
  for (const p of paras) {
    if ((buf + "\n\n" + p).length > target && buf.length > 0) {
      chunks.push(buf);
      const tail = buf.slice(Math.max(0, buf.length - overlap));
      buf = tail + "\n\n" + p;
    } else {
      buf = buf ? buf + "\n\n" + p : p;
    }
  }
  if (buf.trim()) chunks.push(buf);

  // Fallback if a single paragraph is huge: hard split.
  const out: ChunkPiece[] = [];
  let order = 0;
  for (const c of chunks) {
    if (c.length <= target * 1.5) {
      out.push({ text: c, order: order++, tokenCount: Math.ceil(c.length / 4) });
    } else {
      for (let i = 0; i < c.length; i += target - overlap) {
        const slice = c.slice(i, i + target);
        out.push({ text: slice, order: order++, tokenCount: Math.ceil(slice.length / 4) });
      }
    }
  }
  return out;
}
