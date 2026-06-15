import type { ExecutionPlan, ExecutionStep } from "./types";
import type { GoalPlan } from "@/lib/goal/types";

export function generateExecutionPlan(goalPlan: GoalPlan): ExecutionPlan {
  const steps: ExecutionStep[] = goalPlan.steps.map((s) => ({
    id: s.id,
    action: `Navigate to ${s.title}`,
    route: s.route,
    riskLevel: "low",
    requiresConfirmation: true,
  }));

  return {
    goal: goalPlan.goal,
    steps,
    blocked: false,
    safetyWarnings: [],
  };
}
