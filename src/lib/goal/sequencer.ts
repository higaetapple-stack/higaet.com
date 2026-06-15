import type { GoalPlan } from "./types";

export function sequenceGoalSteps(plan: GoalPlan): GoalPlan {
  return {
    ...plan,
    steps: [...plan.steps].sort((a, b) => a.order - b.order),
  };
}
