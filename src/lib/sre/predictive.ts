import type { PredictiveContext, PredictiveResult } from "./types";

/**
 * Pre-deploy predictive gate. Consumes recent live metrics (not the release
 * being shipped) to warn about failure patterns that historically correlate
 * with incidents. Returns allowDeploy=false only at HIGH risk — the gate is
 * conservative on purpose so it stays a guardrail, not a bottleneck.
 */
export function predictFailure(ctx: PredictiveContext): PredictiveResult {
  const warnings: string[] = [];

  if (ctx.paymentFailures > 5 && ctx.errorRate > 3) {
    warnings.push("Checkout instability likely in next release window.");
  }
  if (ctx.signupDrop > 15 && ctx.authErrors > 2) {
    warnings.push("Auth regression risk detected.");
  }
  if (ctx.lighthouseScore < 70) {
    warnings.push("Performance regression trend forming.");
  }
  if (ctx.errorRate > 8) {
    warnings.push("Baseline error rate already elevated — deploy risk high.");
  }

  const riskLevel: PredictiveResult["riskLevel"] =
    warnings.length >= 3 ? "HIGH" : warnings.length >= 1 ? "MEDIUM" : "LOW";

  return {
    riskLevel,
    warnings,
    allowDeploy: riskLevel !== "HIGH",
  };
}
