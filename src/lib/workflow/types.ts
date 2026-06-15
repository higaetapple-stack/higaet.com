export type WorkflowNode = {
  id: string;
  action: string;
  route?: string;
  status: "pending" | "approved" | "blocked" | "completed";
  requiresApproval: boolean;
};

export type WorkflowGraph = {
  goal: string;
  nodes: WorkflowNode[];
  currentIndex: number;
  paused: boolean;
};
