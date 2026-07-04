import { computeGovernanceRisk } from "./risk";
import { buildExplanation } from "./explain";
import type { GovernanceContext, GovernanceDecision, GovernanceResult } from "./types";

export function makeGovernanceDecision(contexts: GovernanceContext[]): GovernanceResult {
  const riskScore = computeGovernanceRisk(contexts);
  const explanation = buildExplanation(contexts);
  const confidence = contexts.length
    ? contexts.reduce((a, c) => a + (c.confidence ?? 0.8), 0) / contexts.length
    : 0;

  let decision: GovernanceDecision;
  if (riskScore > 80) decision = "BLOCK";
  else if (riskScore > 50) decision = "REVIEW_REQUIRED";
  else if (riskScore > 25) decision = "WARN";
  else decision = "ALLOW";

  return { decision, riskScore, confidence, explanation };
}
