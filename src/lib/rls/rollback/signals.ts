import type { RiskLevel } from "../types";

export type FailureInput = {
  runtimeViolations: number;
  simulationDrift: number;
  criticalErrors: number;
};

export type FailureScore = { score: number; level: RiskLevel };

export function computeFailureScore(input: FailureInput): FailureScore {
  const score =
    input.runtimeViolations * 10 +
    input.simulationDrift * 5 +
    input.criticalErrors * 25;
  const level: RiskLevel =
    score > 60
      ? "CRITICAL"
      : score > 30
        ? "HIGH"
        : score > 10
          ? "MEDIUM"
          : "LOW";
  return { score, level };
}
