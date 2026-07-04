import { makeGovernanceDecision } from "./decide";
import { logGovernanceEvent } from "./audit";
import type { GovernanceContext, GovernanceResult } from "./types";

export type GovernorInput = Partial<Record<GovernanceContext["source"], GovernanceContext>> & {
  tenantId?: string;
};

export type GovernorOutput = GovernanceResult & {
  requiresHumanApproval: boolean;
  safeToAutoApply: boolean;
  tenantId?: string;
};

export function runSecurityGovernor(input: GovernorInput): GovernorOutput {
  const contexts = (["compiler", "predictor", "evolver", "rollback", "runtime"] as const)
    .map((k) => input[k])
    .filter((c): c is GovernanceContext => Boolean(c));

  const result = makeGovernanceDecision(contexts);
  const output: GovernorOutput = {
    ...result,
    tenantId: input.tenantId,
    requiresHumanApproval: result.decision === "REVIEW_REQUIRED",
    safeToAutoApply: result.decision === "ALLOW",
  };
  logGovernanceEvent(output);
  return output;
}
