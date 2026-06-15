/**
 * B.11 — AI Query Router · Resolver
 * ---------------------------------------------------------------
 * Hybrid keyword + fuzzy resolver over the INTENT_DATASET.
 * Pure / stateless / SSR-safe. No registry mutation.
 *
 * Embedding layer is intentionally stubbed (Phase-2): if a caller
 * later supplies precomputed vectors we'll fold them in via the
 * hybrid score formula defined in the B.11 spec.
 */

import Fuse from "fuse.js";
import { INTENT_DATASET, type IntentNode } from "./dataset";

export interface IntentMatch {
  node: IntentNode;
  score: number;
  confidence: number; // 0..1
}

function normalizeQuery(q: string): string {
  return q.toLowerCase().trim().replace(/\s+/g, " ");
}

function keywordScore(query: string, node: IntentNode): number {
  let raw = 0;
  for (const k of node.keywords) if (query.includes(k)) raw += 2;
  for (const s of node.synonyms) if (query.includes(s)) raw += 1;
  if (query.includes(node.title.toLowerCase())) raw += 3;
  return raw * node.weight;
}

const fuse = new Fuse(INTENT_DATASET as IntentNode[], {
  keys: [
    { name: "title", weight: 0.4 },
    { name: "keywords", weight: 0.35 },
    { name: "synonyms", weight: 0.15 },
    { name: "description", weight: 0.1 },
  ],
  threshold: 0.4,
  includeScore: true,
  ignoreLocation: true,
});

export function resolveIntentRanked(query: string, limit = 3): IntentMatch[] {
  if (!query || typeof query !== "string") return [];
  const normalized = normalizeQuery(query);
  if (!normalized) return [];

  // Keyword pass
  const kw = new Map<string, number>();
  for (const node of INTENT_DATASET) {
    const s = keywordScore(normalized, node);
    if (s > 0) kw.set(node.path, s);
  }

  // Fuzzy pass — Fuse returns 0=perfect, 1=no match. Invert.
  const fz = new Map<string, number>();
  for (const r of fuse.search(normalized).slice(0, 10)) {
    const inverted = 1 - (r.score ?? 1); // 0..1
    fz.set(r.item.path, inverted);
  }

  // Hybrid: keyword 0.6 · fuzzy 0.4 (embedding reserved for Phase-2)
  const merged = new Map<string, number>();
  for (const node of INTENT_DATASET) {
    const k = kw.get(node.path) ?? 0;
    const f = fz.get(node.path) ?? 0;
    const score = k * 0.6 + f * 4 * 0.4; // scale fuzzy into keyword range
    if (score > 0) merged.set(node.path, score);
  }

  const ranked: IntentMatch[] = [...merged.entries()]
    .map(([path, score]) => {
      const node = INTENT_DATASET.find((n) => n.path === path)!;
      return { node, score, confidence: 0 };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  // Confidence = top score normalized against best possible (top × 1.0)
  const top = ranked[0]?.score ?? 0;
  for (const r of ranked) {
    r.confidence = top > 0 ? Math.min(1, r.score / Math.max(top, 1)) : 0;
  }
  return ranked;
}

export function resolveIntent(query: string): IntentNode | null {
  return resolveIntentRanked(query, 1)[0]?.node ?? null;
}

export function resolveRoute(query: string, fallback = "/academy"): string {
  return resolveIntent(query)?.path ?? fallback;
}
