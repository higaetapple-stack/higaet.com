import { createFileRoute } from "@tanstack/react-router";
import { evaluateConstitution } from "@/lib/constitution/evaluator";
import { generateAmendments } from "@/lib/constitution/generator";
import { scoreAmendments } from "@/lib/constitution/scorer";
import { detectConstitutionDrift } from "@/lib/constitution/drift";
import type { ConstitutionContext } from "@/lib/constitution/types";

function num(v: string | null, fallback: number): number {
  if (v === null) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : fallback;
}

export const Route = createFileRoute("/api/public/constitution/amendments")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const ctx: ConstitutionContext = {
          risk: num(url.searchParams.get("risk"), 0.5),
          confidence: num(url.searchParams.get("confidence"), 0.5),
          friction: num(url.searchParams.get("friction"), 0.6),
          simulationScore: num(url.searchParams.get("simulationScore"), 0.6),
          urgency: num(url.searchParams.get("urgency"), 0.5),
        };
        const evalResult = evaluateConstitution(ctx);
        const amendments = scoreAmendments(generateAmendments(evalResult.violations));
        const drift = detectConstitutionDrift({
          violations: evalResult.severity,
          totalExecutions: Number(url.searchParams.get("totalExecutions")) || 1,
          overBlockedRules: evalResult.violations
            .filter((v) => v.action === "block")
            .map((v) => v.id),
        });
        return Response.json({ amendments, drift });
      },
    },
  },
});
