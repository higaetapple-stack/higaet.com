import { buildOptimalSprint } from "./builder";
import type { SprintItem, SprintPlan, SprintState } from "./types";

/**
 * Adjust capacity for live incident load, then rebuild the sprint from
 * scratch. Every replan reflects current system health, not sprint-start state.
 */
export function replanSprint(state: SprintState, backlog: SprintItem[]): SprintPlan {
  const adjustedCapacity = Math.max(0, state.capacity - state.healthSignals.incidentRate);
  const sprint = buildOptimalSprint(backlog, adjustedCapacity);
  const usedCapacity = sprint.reduce((sum, i) => sum + i.effort, 0);
  return {
    sprint,
    reason: "Replanned based on live system health signals.",
    usedCapacity,
  };
}
