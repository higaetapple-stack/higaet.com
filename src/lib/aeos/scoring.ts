import type { OrgImpactScore, OrgState } from "./types";

/**
 * Weighted org impact score. Positive = healthier org after change.
 * Incidents/reliability weighted highest — they cost the most in real orgs.
 */
export function scoreOrgImpact(before: OrgState, after: OrgState): OrgImpactScore {
  const reliabilityDelta = before.errorRate - after.errorRate;
  const revenueDelta = after.revenue - before.revenue;
  const latencyDelta = before.latency - after.latency;
  const incidentDelta = before.incidentRate - after.incidentRate;

  const raw =
    reliabilityDelta * 4 +
    revenueDelta * 3 +
    latencyDelta * 0.05 +
    incidentDelta * 5;

  const score = Math.round(raw * 100) / 100;

  return {
    score,
    classification:
      score > 10 ? "HIGH_POSITIVE_IMPACT" : score > 0 ? "POSITIVE" : "NEGATIVE_IMPACT",
  };
}
