import type { GovernanceResult } from "./types";

export type ApprovalStatus =
  | "AUTO_APPROVED"
  | "PENDING_APPROVAL"
  | "EXECUTION_BLOCKED"
  | "ADVISORY_WARNING";

export type ApprovalOutcome = {
  status: ApprovalStatus;
  message: string;
};

export function requireApproval(
  result: GovernanceResult & { requiresHumanApproval?: boolean },
): ApprovalOutcome {
  if (result.decision === "BLOCK")
    return { status: "EXECUTION_BLOCKED", message: "System prevented unsafe policy change" };
  if (result.decision === "REVIEW_REQUIRED" || result.requiresHumanApproval)
    return { status: "PENDING_APPROVAL", message: "Human review required before policy execution" };
  if (result.decision === "WARN")
    return { status: "ADVISORY_WARNING", message: "Proceed with caution — advisory warnings raised" };
  return { status: "AUTO_APPROVED", message: "Safe policy operation approved" };
}
