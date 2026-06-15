import type { ConstitutionAmendment } from "./amendments";
import type { ConstitutionVersion } from "./versioning";

export type ValidationResult = { approved: boolean; reason?: string };

export function validateAmendment(
  amendment: ConstitutionAmendment,
  _constitution: ConstitutionVersion,
): ValidationResult {
  if (amendment.status !== "approved") {
    return { approved: false, reason: "Amendment is not human-approved" };
  }
  if (amendment.impactScore > 0.9) {
    return { approved: false, reason: "High-impact amendment requires manual approval" };
  }
  if (amendment.confidence < 0.5) {
    return { approved: false, reason: "Confidence below safety threshold" };
  }
  if (amendment.type === "remove_rule" && !amendment.targetRuleId) {
    return { approved: false, reason: "Remove requires targetRuleId" };
  }
  if (amendment.type === "add_rule" && !amendment.proposedRule) {
    return { approved: false, reason: "Add requires proposedRule" };
  }
  return { approved: true };
}
