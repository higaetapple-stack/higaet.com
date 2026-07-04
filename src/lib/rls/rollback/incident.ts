import type { FailureScore } from "./signals";

export type RLSIncident = {
  type: "AUTO_ROLLBACK_PLAN" | "ROLLBACK_SUGGESTED";
  severity: FailureScore["level"];
  score: number;
  timestamp: number;
};

export function emitRLSIncident(event: {
  failure: FailureScore;
  planned: boolean;
}): RLSIncident {
  const incident: RLSIncident = {
    type: event.planned ? "AUTO_ROLLBACK_PLAN" : "ROLLBACK_SUGGESTED",
    severity: event.failure.level,
    score: event.failure.score,
    timestamp: Date.now(),
  };
  console.log("[RLS_INCIDENT]", JSON.stringify(incident));
  return incident;
}
