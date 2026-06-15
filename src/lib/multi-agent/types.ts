export type AgentRole = "planner" | "researcher" | "navigator" | "validator";

export type AgentTask = {
  id: string;
  role: AgentRole;
  input: string;
  output?: string;
  status: "pending" | "running" | "done" | "blocked";
};

export type AgentContext = {
  goal: string;
  tasks: AgentTask[];
};
