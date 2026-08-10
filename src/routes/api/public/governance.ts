import { createFileRoute } from "@tanstack/react-router";
import { runGovernor } from "@/lib/governor/governor";
import type { GovernorSignals } from "@/lib/governor/types";

function num(v: string | null, fallback: number): number {
  if (v === null) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : fallback;
}

export const Route = createFileRoute("/api/public/governance")({
  loader: async () => ({}),
  component: () => null,
});
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const signals: GovernorSignals = {
          simulationScore: num(url.searchParams.get("simulationScore"), 0.7),
          strategy: url.searchParams.get("strategy") ?? "deep-analysis",
          risk: num(url.searchParams.get("risk"), 0.3),
          executionUrgency: num(url.searchParams.get("executionUrgency"), 0.4),
          memoryBias: num(url.searchParams.get("memoryBias"), 0),
          freshIntent: num(url.searchParams.get("freshIntent"), 0),
          agentDisagreement: num(url.searchParams.get("agentDisagreement"), 0),
        };
        const decision = runGovernor(signals);
        return Response.json({
          finalObjective: decision.finalObjective,
          confidence: decision.confidence,
          conflictsResolved: decision.conflictsResolved,
          resolutions: decision.resolutions,
          conflicts: decision.conflicts,
        });
      },
    },
  },
});
