import type { ImpactScore, ReleaseDelta } from "./types";

/**
 * Weighted impact score. Positive = release improved product.
 * Weights favor reliability and payment success (highest business value)
 * and treat revenue delta as a strong final signal.
 */
export function calculateImpactScore(delta: ReleaseDelta): ImpactScore {
  let score = 0;

  // Positive product signals
  score += delta.signupDelta * 2;
  score += delta.paymentDelta * 3;
  score += delta.lighthouseDelta * 1;

  // Negative reliability signals
  score -= delta.errorDelta * 5;
  score -= delta.crashDelta * 10;

  // Business signal (revenue in currency units — scale down)
  score += delta.revenueDelta * 0.01;

  const rounded = Math.round(score * 100) / 100;

  return {
    score: rounded,
    label:
      rounded > 10
        ? "high improvement"
        : rounded >= 0
          ? "neutral/improvement"
          : "regression",
  };
}
