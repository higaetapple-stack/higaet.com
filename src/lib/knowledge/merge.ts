import type { KnowledgePackage, MergedRecommendation, TrustLevel } from "./types";
import { trustScoreFor } from "./trust";

export type LocalRecommendation = { id: string; effectiveness: number };

export function mergeRecommendations(
  local: LocalRecommendation[],
  external: KnowledgePackage["recommendations"],
  externalTrust: TrustLevel,
): MergedRecommendation[] {
  const localWeight = 1.0;
  const externalWeight = trustScoreFor(externalTrust) * 0.5; // external never outweighs local

  const map = new Map<string, MergedRecommendation>();
  for (const r of local) {
    map.set(r.id, {
      id: r.id,
      localWeight,
      externalWeight: 0,
      score: r.effectiveness * localWeight,
      source: "local",
    });
  }
  for (const r of external) {
    const existing = map.get(r.id);
    if (existing) {
      existing.externalWeight = externalWeight;
      existing.score = existing.score + r.effectiveness * externalWeight;
      existing.source = "merged";
    } else {
      map.set(r.id, {
        id: r.id,
        localWeight: 0,
        externalWeight,
        score: r.effectiveness * externalWeight,
        source: "external",
      });
    }
  }
  return [...map.values()].sort((a, b) => b.score - a.score);
}
