import { createFileRoute } from "@tanstack/react-router";
import { runSimulation } from "@/lib/simulation/engine";
import { simulateAgents } from "@/lib/simulation/agents";
import { aggregateSimulation } from "@/lib/simulation/aggregator";
import { requireAuthHttp } from "@/lib/server/require-auth-http";

export const Route = createFileRoute("/api/public/simulate")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await requireAuthHttp(request);
        if (!auth.ok) return auth.response;
        const url = new URL(request.url);
        const goal = (url.searchParams.get("goal") ?? "").slice(0, 500);
        const complexity = Number(url.searchParams.get("complexity") ?? "0.5");
        const riskLevel = Number(url.searchParams.get("risk") ?? "0.2");

        if (!goal) {
          return Response.json({ error: "missing goal" }, { status: 400 });
        }

        const result = runSimulation({ goal, complexity, riskLevel });
        const agents = simulateAgents(goal);
        const summary = aggregateSimulation(result, agents);

        return Response.json({ result, agents, summary });
      },
    },
  },
});
