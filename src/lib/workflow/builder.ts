import type { WorkflowGraph, WorkflowNode } from "./types";
import type { ExecutionPlan } from "@/lib/execution/types";

export function buildWorkflow(plan: ExecutionPlan): WorkflowGraph {
  const nodes: WorkflowNode[] = plan.steps.map((s) => ({
    id: s.id,
    action: s.action,
    route: s.route,
    status: "pending",
    requiresApproval: true,
  }));

  return {
    goal: plan.goal,
    nodes,
    currentIndex: 0,
    paused: true,
  };
}
