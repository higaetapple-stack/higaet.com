import type { SprintPlan, SprintReport } from "./types";

export function generateSprintReport(plan: SprintPlan): SprintReport {
  return {
    summary: "Sprint optimized for reliability + revenue under current system health.",
    includedItems: plan.sprint.map((i) => i.title),
    rationale: "Items selected by risk-adjusted ROI within incident-adjusted capacity.",
  };
}
