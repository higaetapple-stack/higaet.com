import type { StrategyFeedback, StrategyProfile } from "./types";

export function evolveStrategies(
  strategies: StrategyProfile[],
  feedback: StrategyFeedback[],
): StrategyProfile[] {
  return strategies.map((s) => {
    const related = feedback.filter((f) => f.strategyType === s.type);
    const avg = related.length
      ? related.reduce((a, b) => a + b.score, 0) / related.length
      : s.successRate;
    return { ...s, successRate: s.successRate * 0.7 + avg * 0.3 };
  });
}
