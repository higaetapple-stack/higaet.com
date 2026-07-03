import type { ReleaseDelta } from "./types";

/**
 * Turn raw deltas into human-readable insights.
 * Thresholds are intentionally conservative to reduce noise.
 */
export function generateReleaseInsights(delta: ReleaseDelta): string[] {
  const insights: string[] = [];

  if (delta.errorDelta > 1) {
    insights.push(
      "Error rate increased after release — investigate recent backend changes.",
    );
  }
  if (delta.crashDelta > 0) {
    insights.push(
      `Crash count rose by ${delta.crashDelta} — inspect Sentry issues tagged with this release.`,
    );
  }
  if (delta.paymentDelta < 0) {
    insights.push(
      "Payment success rate dropped — likely checkout or provider regression.",
    );
  }
  if (delta.signupDelta < -1) {
    insights.push(
      "Signup conversion dropped — check auth funnel events and reCAPTCHA/OAuth providers.",
    );
  }
  if (delta.signupDelta > 1) {
    insights.push("Signup conversion improved after release.");
  }
  if (delta.lighthouseDelta > 5) {
    insights.push("Frontend performance improved significantly.");
  }
  if (delta.lighthouseDelta < -5) {
    insights.push(
      "Lighthouse score regressed — verify bundle size and hero image weights.",
    );
  }
  if (delta.revenueDelta < 0) {
    insights.push(
      "Revenue decreased vs baseline — correlate with funnel deltas above.",
    );
  }
  if (insights.length === 0) {
    insights.push("No material regressions detected within the observation window.");
  }
  return insights;
}
