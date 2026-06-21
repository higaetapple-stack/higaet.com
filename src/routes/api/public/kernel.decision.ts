import { createFileRoute } from "@tanstack/react-router";
import { runKernel } from "@/lib/kernel/engine";
import { requireAuthHttp } from "@/lib/server/require-auth-http";

const readScore = (url: URL, key: string) => {
  const value = url.searchParams.get(key);
  if (value == null) return undefined;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const Route = createFileRoute("/api/public/kernel/decision")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await requireAuthHttp(request);
        if (!auth.ok) return auth.response;
        const url = new URL(request.url);
        const decision = runKernel({
          strategyScore: readScore(url, "strategy"),
          simulationScore: readScore(url, "simulation"),
          historicalSuccessRate: readScore(url, "history"),
          risk: readScore(url, "risk"),
          frictionIndex: readScore(url, "friction"),
        });

        return Response.json({
          action: decision.action,
          reason: decision.reason,
          confidence: decision.signals.confidence,
          risk: decision.signals.risk,
          signals: decision.signals,
        });
      },
    },
  },
});
