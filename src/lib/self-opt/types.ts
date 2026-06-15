export type AgentRole = "planner" | "researcher" | "navigator" | "validator";

export type FeedbackSignal = {
  agentRole: AgentRole;
  taskId: string;
  successScore: number;
  latency: number;
  userSatisfaction?: number;
};

export type WeightedSignal = FeedbackSignal & { weightedScore: number };
export type AgentScore = { role: string; avgScore: number };
