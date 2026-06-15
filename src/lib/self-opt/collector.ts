import type { FeedbackSignal, WeightedSignal } from "./types";

export function collectFeedback(signals: FeedbackSignal[]): WeightedSignal[] {
  return signals.map((s) => ({
    ...s,
    weightedScore:
      s.successScore * 0.6 +
      (1 / (s.latency + 1)) * 0.2 +
      (s.userSatisfaction ?? 0.5) * 0.2,
  }));
}
