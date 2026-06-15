export type SimulationMode = "fast-sim" | "deep-sim" | "risk-analysis";

export type SimulationInput = {
  goal: string;
  complexity?: number;
  riskLevel?: number;
  mode?: SimulationMode;
};

export type SimulationResult = {
  id: string;
  successProbability: number;
  estimatedLatency: number;
  strategyUsed: string;
  blockedSteps: number;
};

export type AgentSimulation = {
  role: "planner" | "researcher" | "navigator" | "validator";
  outcome: "success" | "partial" | "failure";
  confidence: number;
};

export type SimulationSummary = {
  overallSuccessProbability: number;
  riskLevel: "low" | "medium" | "high";
  recommendedRun: boolean;
};
