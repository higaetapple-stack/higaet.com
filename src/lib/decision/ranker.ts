import type { DecisionOption } from "./types";

export function rankDecisions(options: DecisionOption[]) {
  return options
    .map((o) => ({
      ...o,
      score: o.confidence * 0.6 + o.impactScore * 0.4,
    }))
    .sort((a, b) => b.score - a.score);
}
