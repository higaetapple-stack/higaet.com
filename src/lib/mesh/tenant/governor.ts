import { runSecurityGovernor, type GovernorInput, type GovernorOutput } from "@/lib/security/governance/orchestrator";
import type { TenantContext } from "./context";

export type TenantGovernor = {
  context: TenantContext;
  evaluate(input: GovernorInput): GovernorOutput;
};

export function createTenantGovernor(context: TenantContext): TenantGovernor {
  return {
    context,
    evaluate(input) {
      return runSecurityGovernor({
        ...input,
        tenantId: context.tenantId,
        runtime: input.runtime
          ? { ...input.runtime, tenantId: context.tenantId }
          : undefined,
      });
    },
  };
}
