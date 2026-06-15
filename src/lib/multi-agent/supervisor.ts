import type { AgentContext, AgentTask } from "./types";

export function createAgentPlan(goal: string): AgentContext {
  const tasks: AgentTask[] = [
    { id: "t1", role: "planner", input: goal, status: "pending" },
    { id: "t2", role: "researcher", input: "fetch relevant knowledge paths", status: "pending" },
    { id: "t3", role: "navigator", input: "map to routes", status: "pending" },
    { id: "t4", role: "validator", input: "verify safety + correctness", status: "pending" },
  ];
  return { goal, tasks };
}
