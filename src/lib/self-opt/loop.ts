import type { FeedbackSignal } from "./types";
import { collectFeedback } from "./collector";
import { scoreAgents } from "./scorer";
import { updateMemoryWeights } from "./optimizer";

export function runOptimizationCycle<T extends { scope: string; confidence: number }>(
  memory: T[],
  signals: FeedbackSignal[],
) {
  const weighted = collectFeedback(signals);
  const scores = scoreAgents(weighted);
  return { memory: updateMemoryWeights(memory, scores), scores };
}
