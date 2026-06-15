import { createFileRoute } from "@tanstack/react-router";
import { STRATEGIES } from "@/lib/strategy/registry";
import { routeStrategy } from "@/lib/strategy/router";

export const Route = createFileRoute("/api/public/strategy")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const intent = url.searchParams.get("intent") ?? "";
        const selected = routeStrategy(intent);
        const profile = STRATEGIES.find((s) => s.type === selected)!;
        const alternatives = STRATEGIES
          .filter((s) => s.type !== selected)
          .sort((a, b) => b.weight * b.successRate - a.weight * a.successRate)
          .map((s) => s.type);
        return Response.json({
          selectedStrategy: selected,
          confidence: Number((profile.weight * 0.4 + profile.successRate * 0.6).toFixed(2)),
          alternatives,
        });
      },
    },
  },
});
