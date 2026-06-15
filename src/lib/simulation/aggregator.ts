import type { AgentSimulation, SimulationResult, SimulationSummary } from "./types";

export function aggregateSimulation(
  result: SimulationResult,
  agents: AgentSimulation[],
): SimulationSummary {
  const agentAvg =
    agents.reduce((a, b) => a + b.confidence, 0) / Math.max(1, agents.length);
  const overall = (result.successProbability + agentAvg) / 2;

  const riskLevel: SimulationSummary["riskLevel"] =
    overall < 0.6 ? "high" : overall < 0.78 ? "medium" : "low";

  return {
    overallSuccessProbability: Number(overall.toFixed(3)),
    riskLevel,
    recommendedRun: overall > 0.75 && result.blockedSteps === 0,
  };
}
