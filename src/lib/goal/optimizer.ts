import type { GoalPlan } from "./types";

export function optimizeGoal(plan: GoalPlan, memoryBias: number): GoalPlan {
  let steps = [...plan.steps];

  if (memoryBias > 0.7) {
    steps = steps.filter((_, i) => i !== 1);
  }

  if (steps.length > 4) {
    steps = steps.slice(0, 4);
  }

  return { ...plan, steps };
}
