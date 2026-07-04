import type { AccessMatrix, RiskLevel } from "./types";

export type DriftReport = {
  changes: string[];
  riskScore: number;
  level: RiskLevel;
};

export function detectDrift(
  before: AccessMatrix | undefined,
  after: AccessMatrix,
): DriftReport {
  const changes: string[] = [];
  let riskScore = 0;

  for (const role of Object.keys(after)) {
    for (const table of Object.keys(after[role])) {
      for (const op of Object.keys(after[role][table]) as Array<
        keyof (typeof after)[string][string]
      >) {
        const prev = before?.[role]?.[table]?.[op];
        const next = after[role][table][op];
        if (prev === "DENY" && next === "ALLOW") {
          changes.push(`Privilege expansion: ${role}.${table}.${op}`);
          riskScore += 10;
        } else if (prev === "ALLOW" && next === "DENY") {
          changes.push(`Privilege reduction: ${role}.${table}.${op}`);
          riskScore += 2;
        }
      }
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

  return { changes, riskScore, level };
}
