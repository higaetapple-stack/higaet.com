/**
 * PR confidence scoring — pure function, no I/O.
 *
 * Combines four signals from the AI SRE analysis into a single 0..1 score
 * and a boolean gate for human review:
 *
 *   1. rootCause.confidence          — how sure the classifier is
 *   2. worst fix-plan risk           — high risk pulls score down
 *   3. hypothesis agreement          — top hypothesis weight vs. runner-up
 *   4. plan concreteness             — presence of targetHint + testHint
 *
 * Any score below AUTO_MERGE_THRESHOLD is marked requires_human_review=true
 * and labeled 'sre-review-required'. Above HIGH_CONFIDENCE_THRESHOLD adds a
 * 'sre-high-confidence' label so reviewers can triage faster.
 */
import type { AISREAnalysis } from "@/lib/sre/ai/orchestrator";

export const HIGH_CONFIDENCE_THRESHOLD = 0.85;
export const AUTO_MERGE_THRESHOLD = 0.9;

export interface PRConfidenceResult {
  score: number; // 0..1, rounded to 3 decimals
  requiresHumanReview: boolean;
  factors: {
    rootCauseConfidence: number;
    riskPenalty: number;
    agreement: number;
    concreteness: number;
  };
  labels: string[];
}

function riskPenalty(analysis: AISREAnalysis): number {
  // 0 = no penalty; 0.4 = worst
  const worst = analysis.fixPlan.reduce((acc, f) => {
    const r = f.risk === "high" ? 0.4 : f.risk === "medium" ? 0.2 : 0.05;
    return Math.max(acc, r);
  }, 0.05);
  return worst;
}

function agreementScore(analysis: AISREAnalysis): number {
  const hyps = [...analysis.rootCause.hypotheses].sort((a, b) => b.weight - a.weight);
  if (hyps.length === 0) return 0.5;
  const top = hyps[0].weight;
  const next = hyps[1]?.weight ?? 0;
  // Wider gap → higher agreement (0..1).
  return Math.max(0, Math.min(1, top - next * 0.5));
}

function concretenessScore(analysis: AISREAnalysis): number {
  if (analysis.fixPlan.length === 0) return 0;
  const scored = analysis.fixPlan.map((f) => {
    const hasTarget = f.targetHint && f.targetHint.length > 3 ? 1 : 0;
    const hasTest = f.testHint && f.testHint.length > 3 ? 1 : 0;
    return (hasTarget + hasTest) / 2;
  });
  return scored.reduce((a, b) => a + b, 0) / scored.length;
}

export function computePRConfidence(analysis: AISREAnalysis): PRConfidenceResult {
  const rootCauseConfidence = Math.max(0, Math.min(1, analysis.rootCause.confidence));
  const penalty = riskPenalty(analysis);
  const agreement = agreementScore(analysis);
  const concreteness = concretenessScore(analysis);

  // Weighted sum. Root cause dominates, then concreteness, then agreement.
  const raw = rootCauseConfidence * 0.5 + concreteness * 0.25 + agreement * 0.15 - penalty * 0.5;
  const score = Math.max(0, Math.min(1, raw));
  const rounded = Math.round(score * 1000) / 1000;

  const labels: string[] = ["ai-sre"];
  const requiresHumanReview = rounded < AUTO_MERGE_THRESHOLD;
  if (requiresHumanReview) labels.push("sre-review-required");
  if (rounded >= HIGH_CONFIDENCE_THRESHOLD) labels.push("sre-high-confidence");

  return {
    score: rounded,
    requiresHumanReview,
    factors: {
      rootCauseConfidence,
      riskPenalty: penalty,
      agreement,
      concreteness,
    },
    labels,
  };
}
