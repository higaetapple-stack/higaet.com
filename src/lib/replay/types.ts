export type AgentRole = "planner" | "researcher" | "navigator" | "validator";

export type ExecutionEvent = {
  id: string;
  timestamp: number;
  agent: AgentRole;
  action: string;
  input: unknown;
  output: unknown;
  metadata?: {
    strategy?: string;
    memoryKeys?: string[];
    blocked?: boolean;
  };
};

export type TimelineStep = {
  step: number;
  timestamp: number;
  agent: AgentRole;
  action: string;
  strategy: string;
  memoryKeys: string[];
  blocked: boolean;
};
