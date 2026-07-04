/**
 * RLS Intelligence Stack — advisory-only.
 *
 * Layers:
 *   1. Static simulation + drift  (analyzePolicyChange, rlsGate)
 *   2. Runtime auditor            (observeQuery, flushRLSAudit)
 *   3. Self-healing suggestions   (runRLSHealing)
 *   4. Rollback planner           (runRLSRollbackSystem — plan-only, no DB writes)
 *   5. Predictive failure engine  (predictRLSFailure, evaluateRLSPullRequest)
 *   6. Policy compiler            (compilePolicyRequest — generates reviewable SQL)
 *   7. Evolution engine           (runRLSEvolution — telemetry-driven suggestions)
 *
 * SAFETY: nothing in this stack mutates the database. All engines emit
 * decisions, suggestions, or plans that require human/CI approval before
 * being applied via the standard migration flow.
 */

export * from "./types";
export * from "./simulate";
export * from "./matrix";
export * from "./drift";
export * from "./analyze";

export * from "./runtime/observer";
export * from "./runtime/evaluate";
export * from "./runtime/violations";
export * from "./runtime/auditor";

export * from "./healing/store";
export * from "./healing/cluster";
export * from "./healing/infer";
export * from "./healing/generate";
export * from "./healing/validate";
export * from "./healing/orchestrator";

export * from "./rollback/store";
export * from "./rollback/signals";
export * from "./rollback/decide";
export * from "./rollback/executor";
export * from "./rollback/incident";
export * from "./rollback/orchestrator";

export * from "./predict/analyze-diff";
export * from "./predict/correlate";
export * from "./predict/simulate";
export * from "./predict/scorer";
export * from "./predict/orchestrator";

export * from "./compiler/intent";
export * from "./compiler/generate";
export * from "./compiler/validate";
export * from "./compiler/orchestrator";
export * from "./compiler/artifact";
export * from "./compiler/api";

export * from "./evolve/telemetry";
export * from "./evolve/scoring";
export * from "./evolve/drift";
export * from "./evolve/mutate";
export * from "./evolve/orchestrator";
export * from "./evolve/feedback";
