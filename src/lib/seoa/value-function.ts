import type { SEOAState } from "./types";

/**
 * Objective function. Reliability + revenue drive value; complexity is
 * heavily penalized to prevent silent long-term entropy.
 */
export function evaluateOrgValue(state: SEOAState): number {
  const raw =
    state.reliability * 4 +
    state.revenue * 3 +
    state.velocity * 2 -
    state.complexity * 5;
  return Math.round(raw * 100) / 100;
}
