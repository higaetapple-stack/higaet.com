import type { StrategyProfile } from "./types";

export const STRATEGIES: StrategyProfile[] = [
  { type: "fast-path", weight: 0.3, successRate: 0.7 },
  { type: "deep-analysis", weight: 0.4, successRate: 0.8 },
  { type: "exploration", weight: 0.2, successRate: 0.65 },
  { type: "precision-mode", weight: 0.1, successRate: 0.85 },
];
