import type { SimulationInput, SimulationResult } from "./types";
import { simulateStrategySelection } from "./strategy";

export function runSimulation(input: SimulationInput): SimulationResult {
  const complexity = input.complexity ?? 0.5;
  const riskLevel = input.riskLevel ?? 0.2;
  const strategy = simulateStrategySelection(input.goal);

  const base = complexity > 0.7 ? 0.62 : 0.84;
  const penalty = riskLevel * 0.2;
  const successProbability = Math.max(0, Math.min(1, base - penalty));

  return {
    id: crypto.randomUUID(),
    successProbability,
    estimatedLatency: Math.round(complexity * 1200),
    strategyUsed: strategy,
    blockedSteps: riskLevel > 0.5 ? 2 : 0,
  };
}
