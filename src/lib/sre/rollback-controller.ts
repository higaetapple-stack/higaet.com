import type { SREDecision } from "./types";

/**
 * SAFE MODE by design: rollback is a *signal*, never an automatic deploy.
 * The signal is what schedulers, alerts, and PR bots consume; the actual
 * production rollback stays human-in-the-loop.
 */
export function shouldRollback(decision: SREDecision) {
  return decision === "ROLLBACK_RECOMMENDED";
}

export type RollbackSignal = {
  action: "ROLLBACK_SIGNAL_SENT" | "NO_ROLLBACK";
  releaseId: string;
  emittedAt: number;
};

export function buildRollbackSignal(
  releaseId: string,
  decision: SREDecision,
): RollbackSignal {
  return {
    action: shouldRollback(decision) ? "ROLLBACK_SIGNAL_SENT" : "NO_ROLLBACK",
    releaseId,
    emittedAt: Date.now(),
  };
}
