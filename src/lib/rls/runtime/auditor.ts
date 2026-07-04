import type { RLSPolicy } from "../types";
import { evaluateRuntimeAccess, type RuntimeEvaluation } from "./evaluate";
import { detectViolations, type ViolationReport } from "./violations";
import type { DBQueryEvent } from "./observer";
import { drainQueue } from "./observer";

export type RuntimeAuditResult = {
  evaluations: RuntimeEvaluation[];
  report: ViolationReport;
};

export function runRuntimeAudit(input: {
  events: DBQueryEvent[];
  policies: RLSPolicy[];
}): RuntimeAuditResult {
  const evaluations = input.events.map((e) =>
    evaluateRuntimeAccess({ event: e, policies: input.policies }),
  );
  const report = detectViolations(evaluations);
  return { evaluations, report };
}

/** Drains the runtime queue and audits it. Returns null when the queue is empty. */
export function flushRLSAudit(policies: RLSPolicy[]): RuntimeAuditResult | null {
  const events = drainQueue();
  if (events.length === 0) return null;
  const result = runRuntimeAudit({ events, policies });
  // Structured log — pluggable sink (Sentry / dashboard) can consume this.
  console.log("[RLS_RUNTIME_AUDIT]", JSON.stringify(result.report));
  return result;
}
