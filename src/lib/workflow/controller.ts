import type { WorkflowGraph } from "./types";

export function advanceWorkflow(graph: WorkflowGraph): WorkflowGraph {
  if (graph.paused) return graph;

  const next = graph.currentIndex + 1;

  return {
    ...graph,
    currentIndex: next >= graph.nodes.length ? graph.currentIndex : next,
  };
}
