import { computeFailureScore, type FailureInput } from "./signals";
import { shouldRollback } from "./decide";
import { planRollback } from "./executor";
import { emitRLSIncident } from "./incident";

export type RollbackRunResult =
  | {
      action: "NO_ACTION";
      failure: ReturnType<typeof computeFailureScore>;
      decision: ReturnType<typeof shouldRollback>;
    }
  | {
      action: "PLAN_READY";
      failure: ReturnType<typeof computeFailureScore>;
      decision: ReturnType<typeof shouldRollback>;
      plan: ReturnType<typeof planRollback>;
      incident: ReturnType<typeof emitRLSIncident>;
    };

/**
 * Produces a rollback PLAN + incident. Never executes DB changes.
 */
export function runRLSRollbackSystem(input: FailureInput): RollbackRunResult {
  const failure = computeFailureScore(input);
  const decision = shouldRollback(failure);
  if (!decision.rollback) return { action: "NO_ACTION", failure, decision };
  const plan = planRollback();
  const incident = emitRLSIncident({ failure, planned: true });
  return { action: "PLAN_READY", failure, decision, plan, incident };
}
