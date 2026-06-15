import type { AgentScore, WeightedSignal } from "./types";

export function scoreAgents(signals: WeightedSignal[]): AgentScore[] {
  const grouped: Record<string, number[]> = {};
  for (const s of signals) {
    (grouped[s.agentRole] ||= []).push(s.weightedScore);
  }
  return Object.entries(grouped).map(([role, scores]) => ({
    role,
    avgScore: scores.reduce((a, b) => a + b, 0) / scores.length,
  }));
}
