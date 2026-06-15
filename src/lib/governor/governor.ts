import { detectConflicts } from "./detector";
import { resolveConflict } from "./resolver";
import type { GovernorDecision, GovernorSignals } from "./types";

export function runGovernor(signals: GovernorSignals): GovernorDecision {
  const conflicts = detectConflicts(signals);
  const resolutions = conflicts.map(resolveConflict);

  if (resolutions.length === 0) {
    return {
      finalObjective: "accuracy",
      confidence: 1,
      conflictsResolved: 0,
      resolutions: [],
      conflicts: [],
    };
  }

  const dominant = [...resolutions].sort(
    (a, b) => b.resolutionConfidence - a.resolutionConfidence,
  )[0];

  return {
    finalObjective: dominant.winner.name,
    confidence: dominant.resolutionConfidence,
    conflictsResolved: conflicts.length,
    resolutions,
    conflicts,
  };
}
