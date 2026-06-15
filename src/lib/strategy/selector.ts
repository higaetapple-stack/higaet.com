import { STRATEGIES } from "./registry";
import type { StrategyProfile } from "./types";

export function selectStrategy(_context?: unknown): StrategyProfile {
  return [...STRATEGIES].sort(
    (a, b) => b.weight * b.successRate - a.weight * a.successRate,
  )[0];
}
