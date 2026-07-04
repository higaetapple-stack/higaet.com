import { clusterViolations } from "./cluster";
import { inferPolicyFix } from "./infer";
import { generatePolicyPatch } from "./generate";
import { validatePatch } from "./validate";
import type { ViolationEvent } from "./store";

export type HealingRecommendation = {
  pattern: string;
  frequency: number;
  inferred: ReturnType<typeof inferPolicyFix>;
  patch: ReturnType<typeof generatePolicyPatch>;
  validation: ReturnType<typeof validatePatch>;
};

export type HealingResult = {
  clusters: ReturnType<typeof clusterViolations>;
  recommendations: HealingRecommendation[];
  decision: "SAFE_TO_APPLY" | "REVIEW_REQUIRED";
};

/**
 * IMPORTANT: never applies DB changes. Produces reviewable recommendations only.
 */
export function runRLSHealing(violations: ViolationEvent[]): HealingResult {
  const clusters = clusterViolations(violations);
  const recommendations: HealingRecommendation[] = clusters.map((c) => {
    const inferred = inferPolicyFix(c.pattern);
    const patch = generatePolicyPatch(c.pattern);
    const validation = validatePatch(patch);
    return { ...c, inferred, patch, validation };
  });
  const decision = recommendations.some((r) => !r.validation.safe)
    ? "REVIEW_REQUIRED"
    : "SAFE_TO_APPLY";
  return { clusters, recommendations, decision };
}
