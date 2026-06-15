import type { ConstitutionAmendment } from "./amendments";
import { getConstitution, pushVersion } from "./store";
import type { ConstitutionalRule } from "./types";
import { validateAmendment } from "./validator";
import type { ConstitutionVersion } from "./versioning";

export type ApplyResult =
  | { status: "applied"; version: ConstitutionVersion }
  | { status: "rejected"; reason: string };

export function applyAmendment(amendment: ConstitutionAmendment): ApplyResult {
  const current = getConstitution();
  const validation = validateAmendment(amendment, current);
  if (!validation.approved) {
    return { status: "rejected", reason: validation.reason ?? "Invalid amendment" };
  }

  let newRules = [...current.rules];

  if (amendment.type === "modify_rule" && amendment.targetRuleId) {
    const idx = newRules.findIndex((r) => r.id === amendment.targetRuleId);
    if (idx === -1) return { status: "rejected", reason: "Target rule not found" };
    newRules[idx] = { ...newRules[idx], ...(amendment.proposedRule ?? {}) } as ConstitutionalRule;
  } else if (amendment.type === "remove_rule") {
    newRules = newRules.filter((r) => r.id !== amendment.targetRuleId);
  } else if (amendment.type === "add_rule" && amendment.proposedRule) {
    newRules.push(amendment.proposedRule as ConstitutionalRule);
  }

  const next: ConstitutionVersion = {
    version: current.version + 1,
    rules: newRules,
    timestamp: Date.now(),
    appliedAmendments: [...current.appliedAmendments, amendment.id],
  };

  return { status: "applied", version: pushVersion(next) };
}
