import type { AgentContext } from "./types";

export function aggregateResults(context: AgentContext) {
  return {
    goal: context.goal,
    summary: context.tasks.map((t) => t.output),
    status: "complete" as const,
    safe: context.tasks.every(
      (t) => t.role !== "validator" || (t.output?.includes("B.10") ?? false),
    ),
  };
}
