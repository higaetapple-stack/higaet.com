/**
 * Sentry incident outcome → risk model feedback hook.
 *
 * Turns a confirmed regression (or a triaged false-positive) into signal
 * feedback for the self-learning PR risk model. Signals are derived from
 * the incident's root-cause categories, mirroring the same taxonomy used
 * during PR-time analysis so learning transfers cleanly.
 */

import type { AISREAnalysis } from "@/lib/sre/ai/orchestrator";
import { recordOutcome, type PROutcome } from "@/lib/risk/learning";

export type SentryOutcome = "regression" | "false_positive" | "resolved_clean";

const CATEGORY_TO_SIGNAL: Record<string, string> = {
  auth: "Authentication subsystem modified",
  payment: "Payment flow touched (high risk area)",
  database: "Database / RLS layer modified",
  webhook: "Webhook handler modified",
  rag: "RAG pipeline modified",
  "null-safety": "Null-safety branch modified",
  validation: "Error-handling branch modified",
};

function toPROutcome(o: SentryOutcome): PROutcome | null {
  if (o === "regression") return "regression";
  if (o === "resolved_clean") return "clean";
  return null; // false_positive → no learning signal
}

export interface SentryFeedbackInput {
  prNumber: number;
  analysis: Pick<AISREAnalysis, "rootCause">;
  outcome: SentryOutcome;
}

export function onSentryOutcome(input: SentryFeedbackInput) {
  const outcome = toPROutcome(input.outcome);
  if (!outcome) return { applied: false, reason: "false_positive ignored" };

  const signals = input.analysis.rootCause.hypotheses
    .map((h) => CATEGORY_TO_SIGNAL[h.category])
    .filter((s): s is string => Boolean(s));

  if (signals.length === 0) return { applied: false, reason: "no mappable signals" };

  recordOutcome({ prNumber: input.prNumber, outcome, signals });
  return { applied: true, signals, outcome };
}
