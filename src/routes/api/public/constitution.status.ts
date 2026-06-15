import { createFileRoute } from "@tanstack/react-router";
import { evaluateConstitution } from "@/lib/constitution/evaluator";
import type { ConstitutionContext } from "@/lib/constitution/types";

function num(v: string | null, fallback: number): number {
  if (v === null) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : fallback;
}

export const Route = createFileRoute("/api/public/constitution/status")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const ctx: ConstitutionContext = {
          risk: num(url.searchParams.get("risk"), 0.3),
          confidence: num(url.searchParams.get("confidence"), 0.8),
          friction: num(url.searchParams.get("friction"), 0.2),
          simulationScore: num(url.searchParams.get("simulationScore"), 0.7),
          urgency: num(url.searchParams.get("urgency"), 0.3),
        };
        return Response.json(evaluateConstitution(ctx));
      },
    },
  },
});
