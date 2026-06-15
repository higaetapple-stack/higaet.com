import type { ConflictSet, GovernorSignals } from "./types";

export function detectConflicts(signals: GovernorSignals): ConflictSet[] {
  const conflicts: ConflictSet[] = [];

  if (signals.simulationScore < 0.6 && signals.strategy === "fast-path") {
    conflicts.push({
      severity: 0.8,
      objectives: [
        { id: "speed-accuracy-1", name: "speed", weight: 0.7, value: 0.9 },
        { id: "speed-accuracy-2", name: "accuracy", weight: 0.9, value: 0.4 },
      ],
    });
  }

  if (signals.risk > 0.6 && signals.executionUrgency > 0.7) {
    conflicts.push({
      severity: 0.9,
      objectives: [
        { id: "safety-exec-1", name: "safety", weight: 1.0, value: 0.3 },
        { id: "safety-exec-2", name: "execution", weight: 0.8, value: 0.9 },
      ],
    });
  }

  if ((signals.memoryBias ?? 0) > 0.6 && (signals.freshIntent ?? 0) > 0.6) {
    conflicts.push({
      severity: 0.6,
      objectives: [
        { id: "mem-fresh-1", name: "exploration", weight: 0.7, value: signals.freshIntent ?? 0 },
        { id: "mem-fresh-2", name: "accuracy", weight: 0.8, value: signals.memoryBias ?? 0 },
      ],
    });
  }

  if ((signals.agentDisagreement ?? 0) > 0.5) {
    conflicts.push({
      severity: signals.agentDisagreement ?? 0.5,
      objectives: [
        { id: "agents-1", name: "accuracy", weight: 0.9, value: 0.7 },
        { id: "agents-2", name: "speed", weight: 0.6, value: 0.8 },
      ],
    });
  }

  return conflicts;
}
