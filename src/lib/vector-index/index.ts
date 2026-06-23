/**
 * B.12 — Vector Knowledge Graph · In-Memory Vector Index
 * ---------------------------------------------------------------
 * Lazy, single-flight semantic index over the B.12 dataset. Calls
 * Google Gemini directly (default model: google/gemini-embedding-001,
 * 3072 dims) via the shared provider router — no per-request
 * recomputation, no SSR blocking on the cold path.
 *
 * Server-only by construction. Do NOT import this module from client
 * components — import only from server functions or server route handlers.
 *
 * Guardrails (B.12 spec):
 *   ❌ no mutation of B.10 graph or B.11 resolver
 *   ❌ no sitemap / breadcrumb / JSON-LD changes
 *   ✔ parallel intelligence layer only
 */

import { buildVectorDataset, type VectorRecord } from "./dataset";
import { aiEmbeddings } from "@/lib/ai-gateway.server";

const EMBEDDING_MODEL = "google/gemini-embedding-001";

/** Feature flag — hybrid integration with B.11 is OFF by default. */
export const VECTOR_HYBRID_ENABLED = false;

export interface VectorMatch {
  path: string;
  title: string;
  score: number; // cosine similarity, -1..1 (typically 0..1)
}

interface VectorIndex {
  records: VectorRecord[];
  builtAt: number;
}

let _index: VectorIndex | null = null;
let _building: Promise<VectorIndex> | null = null;

function cosineSim(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < len; i++) {
    const x = a[i];
    const y = b[i];
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

async function embedOne(input: string): Promise<number[]> {
  const res = await aiEmbeddings({ model: EMBEDDING_MODEL, input });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Embedding request failed (${res.status}): ${body}`);
  }
  const json = (await res.json()) as { data?: Array<{ embedding: number[] }> };
  const vec = json.data?.[0]?.embedding;
  if (!vec || !Array.isArray(vec)) throw new Error("Embedding response missing vector.");
  return vec;
}

/**
 * Build (or return cached) in-memory vector index. Safe to call
 * many times concurrently — single-flight via `_building`.
 */
export async function buildVectorIndex(): Promise<VectorIndex> {
  if (_index) return _index;
  if (_building) return _building;

  _building = (async () => {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error(
        "GEMINI_API_KEY missing — Vector Knowledge Graph (B.12) requires a Gemini API key.",
      );
    }

    const records = buildVectorDataset();
    // Sequential keeps us inside provider per-minute quota.
    for (const r of records) {
      r.embedding = await embedOne(r.text);
    }

    _index = { records, builtAt: Date.now() };
    return _index;
  })();

  try {
    return await _building;
  } finally {
    _building = null;
  }
}

/**
 * Semantic search over the index. Returns top-K matches sorted by
 * cosine similarity. Builds the index on first call (lazy init).
 */
export async function searchSimilar(query: string, k = 5): Promise<VectorMatch[]> {
  if (!query || typeof query !== "string") return [];
  const trimmed = query.trim();
  if (!trimmed) return [];

  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY missing.");

  const index = await buildVectorIndex();
  const qVec = await embedOne(trimmed);

  return index.records
    .map<VectorMatch>((r) => ({
      path: r.path,
      title: r.title,
      score: r.embedding ? cosineSim(qVec, r.embedding) : 0,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, Math.min(k, 25)));
}

/** Top-K helper kept for the spec API surface. */
export async function getTopKMatches(query: string, k = 5): Promise<VectorMatch[]> {
  return searchSimilar(query, k);
}

/** Test-only / introspection. Not part of the public API. */
export function __resetVectorIndexForTests() {
  _index = null;
  _building = null;
}
