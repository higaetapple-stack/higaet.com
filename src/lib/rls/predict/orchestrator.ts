import type { GateDecision } from "../types";
import { analyzeRLSDiff } from "./analyze-diff";
import { correlateWithHistory } from "./correlate";
import { simulateRoleImpact } from "./simulate";
import { computeFailureProbability, type FailureProbability } from "./scorer";

export type PredictionResult = {
  signals: string[];
  impactedRoles: string[];
  prediction: FailureProbability;
  decision: GateDecision;
};

export function predictRLSFailure(diff: string): PredictionResult {
  const signals = analyzeRLSDiff(diff);
  const riskBoost = correlateWithHistory(signals);
  const impactedRoles = simulateRoleImpact(signals);
  const prediction = computeFailureProbability({
    signals,
    riskBoost,
    impactedRoles,
  });
  const decision: GateDecision =
    prediction.level === "CRITICAL"
      ? "BLOCK"
      : prediction.level === "HIGH"
        ? "WARN"
        : "ALLOW";
  return { signals, impactedRoles, prediction, decision };
}

export async function evaluateRLSPullRequest(diff: string) {
  const result = predictRLSFailure(diff);
  return {
    ...result,
    message:
      result.decision === "BLOCK"
        ? "RLS change likely to break production access"
        : result.decision === "WARN"
          ? "RLS change carries elevated risk — review required"
          : "RLS change within acceptable risk bounds",
  };
}
