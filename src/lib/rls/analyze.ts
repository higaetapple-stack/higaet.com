import type { GateDecision, RLSOperation, RLSPolicy } from "./types";
import { buildAccessMatrix } from "./matrix";
import { detectDrift, type DriftReport } from "./drift";

export type AnalyzeInput = {
  beforePolicies: RLSPolicy[];
  afterPolicies: RLSPolicy[];
  roles: string[];
  tables: string[];
  operations: RLSOperation[];
};

export type AnalyzeResult = {
  drift: DriftReport;
  decision: GateDecision;
};

export function analyzePolicyChange(input: AnalyzeInput): AnalyzeResult {
  const before = buildAccessMatrix(
    input.beforePolicies,
    input.roles,
    input.tables,
    input.operations,
  );
  const after = buildAccessMatrix(
    input.afterPolicies,
    input.roles,
    input.tables,
    input.operations,
  );
  const drift = detectDrift(before, after);
  const decision: GateDecision =
    drift.level === "CRITICAL"
      ? "BLOCK"
      : drift.level === "HIGH"
        ? "WARN"
        : "ALLOW";
  return { drift, decision };
}

/** CI-friendly wrapper. */
export async function rlsGate(payload: AnalyzeInput) {
  const result = analyzePolicyChange(payload);
  return { ok: result.decision !== "BLOCK", ...result };
}
