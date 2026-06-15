export type StrategyType =
  | "fast-path"
  | "deep-analysis"
  | "exploration"
  | "precision-mode";

export type StrategyProfile = {
  type: StrategyType;
  weight: number;
  successRate: number;
};

export type StrategyFeedback = {
  strategyType: StrategyType;
  score: number;
};
