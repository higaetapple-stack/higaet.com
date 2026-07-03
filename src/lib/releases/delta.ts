import type { ReleaseDelta, ReleaseSnapshot } from "./types";

/**
 * Compute release delta = after - before.
 * Positive numbers = movement upward from baseline; interpretation is
 * metric-dependent (e.g. positive errorDelta is bad, positive revenueDelta is good).
 */
export function computeReleaseDelta(
  before: ReleaseSnapshot,
  after: ReleaseSnapshot,
): ReleaseDelta {
  return {
    errorDelta: round(after.errorRate - before.errorRate),
    crashDelta: after.crashCount - before.crashCount,
    signupDelta: round(after.signupConversion - before.signupConversion),
    paymentDelta: round(after.paymentSuccessRate - before.paymentSuccessRate),
    revenueDelta: round(after.revenue - before.revenue),
    lighthouseDelta: round(after.lighthouseScore - before.lighthouseScore),
  };
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}
