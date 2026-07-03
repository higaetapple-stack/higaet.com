import type { ReleaseSnapshot } from "../releases/types";
import { formatSREAlert, consoleNotifier, type SRENotifier } from "./alerting";
import { analyzeRelease } from "./engine";
import { buildRollbackSignal, type RollbackSignal } from "./rollback-controller";
import type { SREAnalysis } from "./types";

export type SRECycleResult = {
  analysis: SREAnalysis;
  signal: RollbackSignal;
};

/**
 * One SRE cycle: analyze → alert → emit rollback signal (safe).
 * Injecting the notifier keeps this pure/testable and Worker-safe.
 */
export async function runSRECycle(
  input: {
    releaseId: string;
    before: ReleaseSnapshot;
    after: ReleaseSnapshot;
  },
  notifier: SRENotifier = consoleNotifier,
): Promise<SRECycleResult> {
  const analysis = analyzeRelease(input.releaseId, input.before, input.after);
  const { subject, body } = formatSREAlert(analysis);

  await notifier({ channel: "slack", subject, body, analysis });
  if (analysis.decision === "ROLLBACK_RECOMMENDED") {
    await notifier({ channel: "github", subject, body, analysis });
  }

  return { analysis, signal: buildRollbackSignal(input.releaseId, analysis.decision) };
}
