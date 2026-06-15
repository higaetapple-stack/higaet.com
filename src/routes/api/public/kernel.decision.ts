import { createFileRoute } from "@tanstack/react-router";
import { runKernel } from "@/lib/kernel/engine";

export const Route = createFileRoute("/api/public/kernel/decision")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const num = (k: string) => {
          const v = url.searchParams.get(k);
          return v == null ? undefined : Number(v);
        };
        const decision = runKernel({
          strategyScore: num("strategy"),
          simulationScore: num("simulation"),
          historicalSuccessRate: num("history"),
          risk: num("risk"),
          frictionIndex: num("friction"),
        });
        return Response.json(decision);
      },
    },
  },
});
