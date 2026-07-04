import { enforceGlobalConstraints, type PolicyDescriptor } from "./global/constraints";

export type RouteOutcome =
  | { status: "BLOCK_GLOBAL_POLICY"; violations: string[] }
  | { status: "FORWARD_TO_TENANT"; tenant: string };

export function routeGovernanceDecision(policy: PolicyDescriptor, tenant: string): RouteOutcome {
  const check = enforceGlobalConstraints(policy);
  if (!check.valid) return { status: "BLOCK_GLOBAL_POLICY", violations: check.violations };
  return { status: "FORWARD_TO_TENANT", tenant };
}
