import type { GoalPlan, GoalStep } from "./types";

export function generateGoalPlan(input: {
  intent: string;
  routeGraph?: unknown;
  memoryBias: number;
}): GoalPlan {
  const steps: GoalStep[] = [];

  steps.push({
    id: "entry",
    title: "Start from best matching category",
    route: "/academy",
    order: 1,
    confidence: 0.9,
  });

  if (input.intent.includes("learn")) {
    steps.push({
      id: "browse",
      title: "Browse structured learning paths",
      route: "/academy/learning-paths",
      order: 2,
      confidence: 0.85,
    });
  }

  steps.push({
    id: "execute",
    title: "Select specific program",
    route: "/academy/programs",
    order: 3,
    confidence: 0.8,
  });

  return {
    goal: input.intent,
    steps,
    successProbability: 0.82 + input.memoryBias * 0.1,
  };
}
