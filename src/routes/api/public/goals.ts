import { createFileRoute } from "@tanstack/react-router";
import { generateGoalPlan } from "@/lib/goal/generator";
import { sequenceGoalSteps } from "@/lib/goal/sequencer";
import { optimizeGoal } from "@/lib/goal/optimizer";

export const Route = createFileRoute("/api/public/goals")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const intent = url.searchParams.get("intent") ?? "";
        const memoryBias = Number(url.searchParams.get("memoryBias") ?? "0.5");

        const plan = optimizeGoal(
          sequenceGoalSteps(generateGoalPlan({ intent, memoryBias })),
          memoryBias
        );

        return Response.json(plan);
      },
    },
  },
});
