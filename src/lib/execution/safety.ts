import type { ExecutionPlan } from "./types";

export function safetyCheck(plan: ExecutionPlan): ExecutionPlan {
  const highRiskActions = plan.steps.filter((s) => s.riskLevel === "high");

  if (highRiskActions.length > 0) {
    return {
      ...plan,
      blocked: true,
      safetyWarnings: [
        "High-risk execution detected — manual review required",
      ],
    };
  }

  return plan;
}
