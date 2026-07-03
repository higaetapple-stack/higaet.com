import type { ExecutiveSummary, OptimizationResult } from "./types";

export function generateExecutiveSummary(result: OptimizationResult): ExecutiveSummary {
  const recommendation: ExecutiveSummary["recommendation"] =
    result.bestScore > 50
      ? "STRONG GROWTH STRATEGY"
      : result.bestScore > 20
        ? "BALANCED STRATEGY"
        : "STABILITY-FIRST STRATEGY";
  return {
    recommendation,
    reasoning: [
      "Optimized for reliability + revenue tradeoff.",
      "Simulated impact across multiple roadmap scenarios.",
      "Capacity-infeasible plans excluded.",
    ],
  };
}
