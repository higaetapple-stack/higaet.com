// SEOA — Self-Optimizing Engineering Org Agent
// Pure types; advisory-only, no side effects.

export type WorkItemType = "feature" | "fix" | "refactor" | "infra";
export type WorkItemDomain = "auth" | "payment" | "api" | "ui";

export type WorkItemImpact = {
  reliability: number;
  revenue: number;
  velocity: number;
  complexity: number;
};

export type WorkItem = {
  id: string;
  type: WorkItemType;
  domain: WorkItemDomain;
  effort: number;
  impact: WorkItemImpact;
};

export type SEOAState = {
  reliability: number;
  revenue: number;
  velocity: number;
  complexity: number;
  capacity: number;
};

export type PlanSimulation = {
  finalState: SEOAState;
  score: number;
};

export type OptimizationResult = {
  bestPlan: WorkItem[] | null;
  bestScore: number;
  bestFinalState: SEOAState | null;
};

export type ExecutiveSummary = {
  recommendation:
    | "STRONG GROWTH STRATEGY"
    | "BALANCED STRATEGY"
    | "STABILITY-FIRST STRATEGY";
  reasoning: string[];
};

export type SEOAReport = {
  bestPlan: WorkItem[] | null;
  bestScore: number;
  strategy: string[];
  summary: ExecutiveSummary;
};
