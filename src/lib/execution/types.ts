export type ExecutionStep = {
  id: string;
  action: string;
  target?: string;
  route?: string;
  riskLevel: "low" | "medium" | "high";
  requiresConfirmation: boolean;
};

export type ExecutionPlan = {
  goal: string;
  steps: ExecutionStep[];
  blocked: boolean;
  safetyWarnings: string[];
};
