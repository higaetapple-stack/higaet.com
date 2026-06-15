import type { DecisionOption } from "./types";

export function explainDecision(decision: DecisionOption) {
  return {
    summary: decision.action,
    why: decision.reasoning,
    confidence: decision.confidence,
    outcome: decision.impactScore > 0.7 ? "high value path" : "exploratory path",
  };
}
