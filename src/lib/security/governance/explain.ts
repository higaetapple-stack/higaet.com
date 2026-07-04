import type { GovernanceContext } from "./types";

export function buildExplanation(contexts: GovernanceContext[]): string[] {
  const reasons: string[] = [];
  for (const c of contexts) {
    if (c.riskScore > 70) reasons.push(`High risk from ${c.source} (score=${c.riskScore})`);
    if (c.source === "runtime" && c.riskScore > 0)
      reasons.push("Active production violations detected");
    if (c.source === "evolver" && c.riskScore > 40)
      reasons.push("Policy drift detected from behavioral learning");
    if (c.source === "rollback" && c.riskScore > 0)
      reasons.push("Recent rollback history indicates instability");
    if (c.source === "predictor" && c.riskScore > 50)
      reasons.push("Predictive engine forecasts likely failure");
    if (c.explanation) reasons.push(...c.explanation);
  }
  return reasons;
}
