import type { ConstitutionAmendment } from "./amendments";
import type { ConstitutionEvaluation } from "./types";

type ViolationLike = ConstitutionEvaluation["violations"][number];

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `amend_${Math.random().toString(36).slice(2)}`;
}

export function generateAmendments(
  violations: ViolationLike[],
): ConstitutionAmendment[] {
  const amendments: ConstitutionAmendment[] = [];

  for (const v of violations) {
    if (v.id === "safe-execution-only") {
      amendments.push({
        id: uid(),
        type: "modify_rule",
        targetRuleId: v.id,
        reason: "Frequent false positives under medium confidence workloads",
        impactScore: 0.72,
        confidence: 0.68,
        status: "pending",
      });
    }

    if (v.id === "simulation-required") {
      amendments.push({
        id: uid(),
        type: "modify_rule",
        targetRuleId: v.id,
        reason: "Simulation gate over-triggering low-risk queries",
        impactScore: 0.81,
        confidence: 0.74,
        status: "pending",
      });
    }

    if (v.id === "friction-awareness") {
      amendments.push({
        id: uid(),
        type: "modify_rule",
        targetRuleId: v.id,
        reason: "Friction threshold too sensitive; consider raising to 0.65",
        impactScore: 0.55,
        confidence: 0.6,
        status: "pending",
      });
    }
  }

  return amendments;
}
