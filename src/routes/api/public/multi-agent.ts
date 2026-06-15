import { createFileRoute } from "@tanstack/react-router";
import { createAgentPlan } from "@/lib/multi-agent/supervisor";
import { runMultiAgentSystem } from "@/lib/multi-agent/orchestrator";
import { aggregateResults } from "@/lib/multi-agent/aggregator";

export const Route = createFileRoute("/api/public/multi-agent")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const goal = url.searchParams.get("goal") ?? "untitled";
        const ctx = runMultiAgentSystem(createAgentPlan(goal));
        const result = aggregateResults(ctx);
        return Response.json({ ...result, tasks: ctx.tasks });
      },
    },
  },
});
