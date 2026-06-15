import { createFileRoute } from "@tanstack/react-router";
import { generateDecisions } from "@/lib/decision/engine";
import { rankDecisions } from "@/lib/decision/ranker";

export const Route = createFileRoute("/api/public/decisions")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const intent = url.searchParams.get("intent") ?? "";
        const route = url.searchParams.get("route") ?? "/";

        const decisions = rankDecisions(
          generateDecisions({
            intent,
            predictions: [{ route: "/academy" }],
            memoryBias: 0.5,
            currentRoute: route,
          })
        );

        return Response.json({ decisions });
      },
    },
  },
});
