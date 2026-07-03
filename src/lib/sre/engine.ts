import { computeReleaseDelta } from "../releases/delta";
import { generateReleaseInsights } from "../releases/insights";
import { calculateImpactScore } from "../releases/scoring";
import type { ReleaseSnapshot } from "../releases/types";
import type { SREAnalysis, SREDecision } from "./types";

/**
 * Pure AI-SRE reasoning: given before/after snapshots, decide ALLOW / WARN /
 * ROLLBACK_RECOMMENDED and explain the decision. No side effects.
 */
export function analyzeRelease(
  releaseId: string,
  before: ReleaseSnapshot,
  after: ReleaseSnapshot,
): SREAnalysis {
  const delta = computeReleaseDelta(before, after);
  const score = calculateImpactScore(delta);
  const insights = generateReleaseInsights(delta);
  const { decision, reasons } = decide(score.score, delta);
  return { releaseId, delta, score, insights, decision, reasons };
}

function decide(
  score: number,
  delta: ReturnType<typeof computeReleaseDelta>,
): { decision: SREDecision; reasons: string[] } {
  const reasons: string[] = [];

  // Hard rollback triggers — any one is enough regardless of score.
  if (delta.crashDelta >= 3) {
    reasons.push(`Crash count rose by ${delta.crashDelta}.`);
  }
  if (delta.paymentDelta <= -3) {
    reasons.push(
      `Payment success dropped ${Math.abs(delta.paymentDelta)}% vs baseline.`,
    );
  }
  if (delta.errorDelta >= 3) {
    reasons.push(`Error rate rose ${delta.errorDelta}% vs baseline.`);
  }

  if (reasons.length > 0 || score <= -10) {
    if (reasons.length === 0) reasons.push(`Impact score ${score} <= -10.`);
    return { decision: "ROLLBACK_RECOMMENDED", reasons };
  }

  if (score < 0) {
    return {
      decision: "WARN",
      reasons: [`Impact score ${score} is negative but above rollback threshold.`],
    };
  }

  return {
    decision: "ALLOW",
    reasons: [`Impact score ${score} is non-negative and no hard triggers hit.`],
  };
}
