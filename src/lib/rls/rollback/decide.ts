import type { FailureScore } from "./signals";

export type RollbackDecision = { rollback: boolean; reason: string };

export function shouldRollback(failure: FailureScore): RollbackDecision {
  if (failure.level === "CRITICAL") {
    return { rollback: true, reason: "Critical RLS failure threshold exceeded" };
  }
  if (failure.level === "HIGH" && failure.score > 40) {
    return { rollback: true, reason: "High-risk access control degradation" };
  }
  return { rollback: false, reason: "Within acceptable risk bounds" };
}
