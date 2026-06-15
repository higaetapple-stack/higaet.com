export type AgentRole = "planner" | "researcher" | "navigator" | "validator";

export type AgentHealth = {
  role: AgentRole;
  successRate: number;
  rejectionRate: number;
  avgLatency: number;
};

export type SystemHealthSnapshot = {
  timestamp: number;
  agentHealth: AgentHealth[];
  friction: Record<string, number>;
  strategyDistribution: Record<string, number>;
  memoryLoad: number;
};

export type AggregatedHealth = {
  systemStability: number;
  bottlenecks: Array<[string, number]>;
  dominantStrategy: string | null;
};
