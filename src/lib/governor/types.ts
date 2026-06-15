export type ObjectiveName =
  | "speed"
  | "accuracy"
  | "safety"
  | "cost"
  | "exploration"
  | "execution";

export type Objective = {
  id: string;
  name: ObjectiveName;
  weight: number;
  value: number;
};

export type ConflictSet = {
  objectives: Objective[];
  severity: number;
};

export type GovernorSignals = {
  simulationScore: number;
  strategy: string;
  risk: number;
  executionUrgency: number;
  memoryBias?: number;
  freshIntent?: number;
  agentDisagreement?: number;
};

export type Resolution = {
  winner: Objective;
  discarded: Objective[];
  resolutionConfidence: number;
};

export type GovernorDecision = {
  finalObjective: ObjectiveName;
  confidence: number;
  conflictsResolved: number;
  resolutions: Resolution[];
  conflicts: ConflictSet[];
};
