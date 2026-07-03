import { evaluateOrgValue } from "./value-function";
import type { PlanSimulation, SEOAState, WorkItem } from "./types";

/** Apply a plan's cumulative impact to a starting org state. Pure. */
export function simulatePlan(state: SEOAState, items: WorkItem[]): PlanSimulation {
  const next: SEOAState = { ...state };
  for (const item of items) {
    next.reliability += item.impact.reliability;
    next.revenue += item.impact.revenue;
    next.velocity += item.impact.velocity;
    next.complexity += item.impact.complexity;
    next.capacity -= item.effort;
  }
  return { finalState: next, score: evaluateOrgValue(next) };
}
