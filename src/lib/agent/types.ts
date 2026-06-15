export type AgentStep = {
  id: string;
  action: string;
  route?: string;
  status: "pending" | "approved" | "executing" | "blocked" | "done";
  riskLevel: "low" | "medium" | "high";
};

export type AgentSession = {
  goal: string;
  steps: AgentStep[];
  currentStep: number;
  mode: "sandbox" | "strict";
};
