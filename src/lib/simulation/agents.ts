import type { AgentSimulation } from "./types";

export function simulateAgents(goal: string): AgentSimulation[] {
  const long = goal.length > 40;
  return [
    { role: "planner", outcome: "success", confidence: long ? 0.78 : 0.88 },
    { role: "researcher", outcome: long ? "partial" : "success", confidence: 0.74 },
    { role: "navigator", outcome: "success", confidence: 0.81 },
    { role: "validator", outcome: "success", confidence: 0.92 },
  ];
}
