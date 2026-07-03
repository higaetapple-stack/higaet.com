import type { SREAnalysis } from "./types";

/**
 * Notifier abstraction. Slack / GitHub / email adapters implement this
 * without pulling Node-only SDKs into the Worker bundle. Wire real adapters
 * (e.g. Lovable Slack connector gateway, GitHub Issues API) at call sites.
 */
export type SRENotifier = (payload: {
  channel: "slack" | "github" | "log";
  subject: string;
  body: string;
  analysis: SREAnalysis;
}) => Promise<void> | void;

const EMOJI: Record<SREAnalysis["decision"], string> = {
  ROLLBACK_RECOMMENDED: "🚨",
  WARN: "⚠️",
  ALLOW: "✅",
};

export function formatSREAlert(analysis: SREAnalysis): {
  subject: string;
  body: string;
} {
  const emoji = EMOJI[analysis.decision];
  const subject = `${emoji} AI SRE — ${analysis.decision} for ${analysis.releaseId}`;
  const body = [
    `${emoji} AI SRE ANALYSIS`,
    ``,
    `Release: ${analysis.releaseId}`,
    `Decision: ${analysis.decision}`,
    `Score: ${analysis.score.score} (${analysis.score.label})`,
    ``,
    `Reasons:`,
    ...analysis.reasons.map((r) => `- ${r}`),
    ``,
    `Insights:`,
    ...analysis.insights.map((i) => `- ${i}`),
    ``,
    `Next step: open the Release Intelligence dashboard.`,
  ].join("\n");
  return { subject, body };
}

/** Default notifier: structured log line. Safe on any runtime. */
export const consoleNotifier: SRENotifier = ({ subject, body }) => {
  // eslint-disable-next-line no-console
  console.warn(`[sre] ${subject}\n${body}`);
};
