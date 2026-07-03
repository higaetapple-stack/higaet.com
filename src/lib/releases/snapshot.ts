import type { ReleaseSnapshot } from "./types";

/**
 * Fetch a release-window snapshot.
 *
 * v1 stub: returns deterministic sample data so the RIV dashboard renders
 * end-to-end. Replace the body with real integrations when available:
 *   - Sentry Releases API (errorRate, crashCount) filtered by release_id
 *   - PostHog cohort funnels (signupConversion, paymentSuccessRate)
 *   - `payments` table aggregation (revenue)
 *   - Lighthouse CI artifacts (lighthouseScore)
 *
 * The dashboard consumes only the `ReleaseSnapshot` contract, so swapping
 * the implementation is safe.
 */
export async function fetchReleaseSnapshot(
  releaseId: string,
  range: "before" | "after",
): Promise<ReleaseSnapshot> {
  const isBefore = range === "before";
  return {
    releaseId,
    timestamp: Date.now() - (isBefore ? 48 : 24) * 60 * 60 * 1000,
    errorRate: isBefore ? 2.1 : 3.4,
    crashCount: isBefore ? 1 : 4,
    signupConversion: isBefore ? 41 : 44,
    paymentSuccessRate: isBefore ? 92 : 90,
    revenue: isBefore ? 12000 : 11800,
    lighthouseScore: isBefore ? 82 : 88,
  };
}
