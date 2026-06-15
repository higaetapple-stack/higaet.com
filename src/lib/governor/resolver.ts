import type { ConflictSet, Resolution } from "./types";

export function resolveConflict(conflict: ConflictSet): Resolution {
  const ranked = [...conflict.objectives].sort(
    (a, b) => b.weight * b.value - a.weight * a.value,
  );
  const winner = ranked[0];
  return {
    winner,
    discarded: ranked.slice(1),
    resolutionConfidence: winner.weight * winner.value,
  };
}
