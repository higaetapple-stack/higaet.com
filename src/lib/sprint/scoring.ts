import type { SprintItem } from "./types";

/**
 * Risk-adjusted ROI for a sprint item. Value from revenue + reliability,
 * penalized by complexity and item risk. Deterministic, pure.
 */
export function scoreSprintItem(item: SprintItem): number {
  const value =
    item.predictedImpact.revenue * 3 +
    item.predictedImpact.reliability * 4 -
    item.predictedImpact.complexity * 5;
  const riskPenalty = item.risk * 3;
  return Math.round((value - riskPenalty) * 100) / 100;
}
