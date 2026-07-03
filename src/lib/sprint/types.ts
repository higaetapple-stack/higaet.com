// LSPEA — Live Sprint Planning & Execution Agent
// Pure types.

export type SprintItemType = "feature" | "fix" | "refactor" | "infra";
export type SprintItemDomain = "auth" | "payment" | "api" | "ui";

export type SprintItemImpact = {
  reliability: number;
  revenue: number;
  velocity: number;
  complexity: number;
};

export type SprintItem = {
  id: string;
  title: string;
  type: SprintItemType;
  domain: SprintItemDomain;
  effort: number;
  priorityScore: number;
  risk: number;
  predictedImpact: SprintItemImpact;
};

export type HealthSignals = {
  errorRate: number;
  incidentRate: number;
  deploymentStability: number;
};

export type SprintState = {
  capacity: number;
  healthSignals: HealthSignals;
};

export type SprintPlan = {
  sprint: SprintItem[];
  reason: string;
  usedCapacity: number;
};

export type SprintIntelligenceContext = {
  backlog: SprintItem[];
  capacity: number;
  healthSignals: HealthSignals;
  sre: { riskScore: number };
  riv: { errorDelta: number };
  aeos: { simulation: { finalState: { incidentRate: number } } };
};

export type SprintReport = {
  summary: string;
  includedItems: string[];
  rationale: string;
};
