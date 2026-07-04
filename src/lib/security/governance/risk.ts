import type { GovernanceContext } from "./types";

export function computeGovernanceRisk(contexts: GovernanceContext[]): number {
  let score = 0;
  for (const c of contexts) {
    score += c.riskScore * 0.4;
    if (c.source === "runtime") score += 15;
    if (c.source === "predictor") score += 20;
    if (c.source === "rollback") score += 10;
  }
  return Math.min(Math.round(score), 100);
}
