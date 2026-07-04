import type { RiskLevel } from "../types";

export type FailureProbability = { probability: number; level: RiskLevel };

export function computeFailureProbability(input: {
  signals: string[];
  riskBoost: number;
  impactedRoles: string[];
}): FailureProbability {
  const base =
    input.signals.length * 10 +
    input.riskBoost +
    input.impactedRoles.length * 8;
  const probability = Math.min(base, 100);
  const level: RiskLevel =
    probability > 70
      ? "CRITICAL"
      : probability > 40
        ? "HIGH"
        : probability > 20
          ? "MEDIUM"
          : "LOW";
  return { probability, level };
}
