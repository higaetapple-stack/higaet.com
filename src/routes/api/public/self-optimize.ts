import { createFileRoute } from "@tanstack/react-router";
import { runOptimizationCycle } from "@/lib/self-opt/loop";
import { memory } from "@/lib/shared-memory/store";
import type { FeedbackSignal } from "@/lib/self-opt/types";

export const Route = createFileRoute("/api/public/self-optimize")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: any = {};
        try {
          body = await request.json();
        } catch {}
        const signals: FeedbackSignal[] = Array.isArray(body?.signals) ? body.signals : [];
        const { memory: updated, scores } = runOptimizationCycle(memory, signals);
        // write back confidences (memory weights only; no logic changes)
        for (let i = 0; i < memory.length; i++) memory[i].confidence = updated[i].confidence;
        return Response.json({ status: "cycle_complete", agents: scores });
      },
    },
  },
});
