import { scoreOrgImpact } from "./scoring";
import { simulateChange } from "./simulator";
import type { OrgState, RoadmapSimulation, SimulatedChange } from "./types";

/**
 * Simulate a roadmap sequence step-by-step. Each step scored against the
 * state immediately before it, so the timeline mirrors real release order.
 */
export function simulateRoadmap(
  initialState: OrgState,
  changes: SimulatedChange[],
): RoadmapSimulation {
  let state = { ...initialState };
  const timeline: RoadmapSimulation["timeline"] = [];

  for (const change of changes) {
    const before = { ...state };
    const after = simulateChange(state, change);
    timeline.push({ change, before, after, score: scoreOrgImpact(before, after) });
    state = after;
  }

  return { finalState: state, timeline };
}
