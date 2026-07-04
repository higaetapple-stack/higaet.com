import { createTenantGovernor } from "./tenant/governor";
import type { TenantContext } from "./tenant/context";
import { aggregateMeshState, type TenantResult, type MeshSystemState } from "./global/aggregator";
import type { GovernorInput } from "@/lib/security/governance/orchestrator";

export type MeshRunResult = {
  results: TenantResult[];
  system: MeshSystemState;
};

export function runGovernanceMesh(tenants: TenantContext[], input: GovernorInput): MeshRunResult {
  const results: TenantResult[] = tenants.map((tenant) => {
    const governor = createTenantGovernor(tenant);
    const decision = governor.evaluate(input);
    return {
      tenant: tenant.tenantId,
      decision: decision.decision,
      riskScore: decision.riskScore,
    };
  });
  return { results, system: aggregateMeshState(results) };
}
