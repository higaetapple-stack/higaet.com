import type { SystemHealthSnapshot } from "./types";

/**
 * Read-only snapshot of current system state.
 * B.47 MUST NOT mutate any layer — this only reads.
 * Values are deterministic stubs until upstream layers expose live counters.
 */
export function buildSystemSnapshot(): SystemHealthSnapshot {
  return {
    timestamp: Date.now(),
    agentHealth: [
      { role: "planner", successRate: 0.82, rejectionRate: 0.12, avgLatency: 140 },
      { role: "researcher", successRate: 0.91, rejectionRate: 0.05, avgLatency: 220 },
      { role: "navigator", successRate: 0.64, rejectionRate: 0.28, avgLatency: 180 },
      { role: "validator", successRate: 0.95, rejectionRate: 0.03, avgLatency: 90 },
    ],
    friction: {
      "workflow-gate": 7,
      "strategy-reject": 3,
      "agent-block": 12,
    },
    strategyDistribution: {
      "deep-analysis": 24,
      "fast-path": 11,
      "precision-mode": 6,
      exploration: 4,
    },
    memoryLoad: 0.42,
  };
}
