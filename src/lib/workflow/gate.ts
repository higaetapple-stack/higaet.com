import type { WorkflowNode } from "./types";

export function requestApproval(node: WorkflowNode) {
  return {
    node,
    status: "awaiting_user_approval" as const,
    required: true,
  };
}
