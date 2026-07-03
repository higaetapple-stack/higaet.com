// AEOS — Autonomous Engineering Org Simulator
// Pure types. No side effects, no runtime deps.

export type OrgState = {
  errorRate: number;
  revenue: number;
  latency: number;
  deploymentFrequency: number;
  incidentRate: number;
  developerLoad: number;
};

export type ChangeType = "feature" | "refactor" | "fix" | "infra";
export type ChangeArea = "auth" | "payment" | "performance" | "ui" | "infra";

export type SimulatedChange = {
  id: string;
  type: ChangeType;
  affects: ChangeArea;
  description?: string;
};

export type OrgImpactClassification =
  | "HIGH_POSITIVE_IMPACT"
  | "POSITIVE"
  | "NEGATIVE_IMPACT";

export type OrgImpactScore = {
  score: number;
  classification: OrgImpactClassification;
};

export type SimulationStep = {
  change: SimulatedChange;
  before: OrgState;
  after: OrgState;
  score: OrgImpactScore;
};

export type RoadmapSimulation = {
  finalState: OrgState;
  timeline: SimulationStep[];
};

export type AEOSReport = {
  simulation: RoadmapSimulation;
  recommendations: string[];
  portfolio: {
    portfolioHealth: "STRONG" | "STABLE" | "RISKY";
    totalScore: number;
  };
};
