import { simulatePlan } from "./simulate";
import type { OptimizationResult, SEOAState, WorkItem } from "./types";

/**
 * Given candidate plans (each already a valid ordering of work items),
 * pick the plan with the highest projected org value. Plans that
 * over-spend capacity are discarded to keep recommendations realistic.
 */
export function optimizeRoadmap(
  state: SEOAState,
  candidatePlans: WorkItem[][],
): OptimizationResult {
  let bestPlan: WorkItem[] | null = null;
  let bestScore = -Infinity;
  let bestFinalState: SEOAState | null = null;

  for (const plan of candidatePlans) {
    const result = simulatePlan(state, plan);
    if (result.finalState.capacity < 0) continue;
    if (result.score > bestScore) {
      bestScore = result.score;
      bestPlan = plan;
      bestFinalState = result.finalState;
    }
  }

  return { bestPlan, bestScore: bestScore === -Infinity ? 0 : bestScore, bestFinalState };
}
