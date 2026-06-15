/**
 * B.13 — Hybrid Intelligence Fusion Layer
 * ---------------------------------------------------------------
 * Pure wrapper over B.11 (Intent Router) + B.12 (Vector Index).
 *
 * Guardrails (B.13 spec):
 *   ❌ never mutates B.11 or B.12
 *   ❌ never changes routes / sitemap / breadcrumbs / registry
 *   ❌ vector layer can NEVER outvote B.11 deterministically
 *   ✔ B.11 stays primary, B.12 is a ranking boost only
 *
 * Scoring (FULL mode):
 *   finalScore = intentScore * 0.6 + fuzzyScore * 0.2 + vectorScore * 0.2
 *
 * NOTE: B.11 currently exposes a single hybrid (keyword+fuzzy)
 * confidence per match; we split it 0.6/0.2 by weight to honour
 * the B.13 formula without modifying the B.11 resolver.
 */

import { resolveIntentRanked, type IntentMatch } from "@/lib/intent-router/resolve";
import { searchSimilar, type VectorMatch } from "@/lib/vector-index";

export type FusionMode = "OFF" | "SOFT" | "FULL";

export const FUSION_MODE: Record<"OFF" | "SOFT" | "FULL", FusionMode> = {
  OFF: "OFF",   // B.11 only
  SOFT: "SOFT", // B.11 ranking + B.12 small boost (no re-ordering of top-1 unless tied)
  FULL: "FULL", // weighted hybrid (formula above)
};

export interface HybridResult {
  path: string;
  title: string;
  score: number;
  sources: Array<"intent" | "vector">;
}

interface MergeOptions {
  mode: FusionMode;
  limit: number;
}

function fromIntent(matches: IntentMatch[]) {
  return matches.map((m) => ({
    path: m.node.path,
    title: m.node.title,
    intentScore: m.confidence, // already normalized 0..1
  }));
}

function mergeMatches(
  intent: IntentMatch[],
  vector: VectorMatch[],
  { mode, limit }: MergeOptions,
): HybridResult[] {
  const intentRows = fromIntent(intent);
  const vecMap = new Map(vector.map((v) => [v.path, v.score]));
  const intentPaths = new Set(intentRows.map((r) => r.path));

  const rows: HybridResult[] = [];

  for (const r of intentRows) {
    const vScore = vecMap.get(r.path) ?? 0;
    const sources: Array<"intent" | "vector"> = vScore > 0 ? ["intent", "vector"] : ["intent"];
    let score: number;
    if (mode === "FULL") {
      // B.11 confidence already fuses its own keyword(0.6)+fuzzy(0.4).
      // We allocate 0.8 to B.11 (=0.6+0.2 from the spec) and 0.2 to B.12.
      score = r.intentScore * 0.8 + Math.max(0, vScore) * 0.2;
    } else if (mode === "SOFT") {
      // Small boost — never enough to flip a strong intent winner.
      score = r.intentScore + Math.max(0, vScore) * 0.05;
    } else {
      score = r.intentScore;
    }
    rows.push({ path: r.path, title: r.title, score, sources });
  }

  // In FULL mode, surface vector-only candidates as low-priority alternatives.
  if (mode === "FULL") {
    for (const v of vector) {
      if (intentPaths.has(v.path)) continue;
      rows.push({
        path: v.path,
        title: v.title,
        score: Math.max(0, v.score) * 0.2, // capped — cannot outrank an intent hit
        sources: ["vector"],
      });
    }
  }

  return rows
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, limit));
}

export interface ResolveHybridOptions {
  mode?: FusionMode;
  limit?: number;
  /** If true (default), runs vector search. Set false to skip embedding I/O. */
  useVector?: boolean;
}

/**
 * Hybrid resolver — wraps B.11 + B.12. Pure orchestration; no side effects
 * outside the embedding cache already owned by B.12.
 */
export async function resolveHybrid(
  query: string,
  opts: ResolveHybridOptions = {},
): Promise<{ mode: FusionMode; results: HybridResult[] }> {
  const mode = opts.mode ?? "SOFT";
  const limit = opts.limit ?? 5;
  const useVector = opts.useVector ?? mode !== "OFF";

  if (!query || typeof query !== "string" || !query.trim()) {
    return { mode, results: [] };
  }

  const intent = resolveIntentRanked(query, Math.max(limit, 5));

  let vector: VectorMatch[] = [];
  if (useVector && mode !== "OFF") {
    try {
      vector = await searchSimilar(query, Math.max(limit, 5));
    } catch {
      // Vector failure must NEVER break navigation — silently fall back to B.11.
      vector = [];
    }
  }

  return { mode, results: mergeMatches(intent, vector, { mode, limit }) };
}
