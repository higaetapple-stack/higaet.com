import type { ExecutionPlan } from "./types";

export type GatedExecutionPlan = ExecutionPlan & {
  requiresApproval: true;
  status: "pending_user_confirmation";
};

export function requiresUserApproval(plan: ExecutionPlan): GatedExecutionPlan {
  return {
    ...plan,
    requiresApproval: true,
    status: "pending_user_confirmation",
  };
}
