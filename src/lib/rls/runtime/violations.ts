import type { RiskLevel } from "../types";
import type { RuntimeEvaluation } from "./evaluate";

export type ViolationReport = {
  violations: string[];
  riskScore: number;
  level: RiskLevel;
};

export function detectViolations(results: RuntimeEvaluation[]): ViolationReport {
  const violations: string[] = [];
  let riskScore = 0;
  for (const r of results) {
    if (r.mismatch === "UNEXPECTED_ALLOW") {
      violations.push(
        `Policy bypass: ${r.event.role}.${r.event.table}.${r.event.operation}`,
      );
      riskScore += 15;
    }
  }
  const level: RiskLevel =
    riskScore > 50
      ? "CRITICAL"
      : riskScore > 20
        ? "HIGH"
        : riskScore > 5
          ? "MEDIUM"
          : "LOW";
  return { violations, riskScore, level };
}
