import type { AgentScore } from "./types";

export function updateMemoryWeights<T extends { scope: string; confidence: number }>(
  memory: T[],
  scores: AgentScore[],
): T[] {
  return memory.map((m) => {
    const match = scores.find((s) => s.role === m.scope);
    return match
      ? { ...m, confidence: m.confidence * 0.7 + match.avgScore * 0.3 }
      : m;
  });
}
