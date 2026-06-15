import { createFileRoute } from "@tanstack/react-router";
import { replayEvents } from "@/lib/replay/engine";
import { buildTimeline } from "@/lib/replay/timeline";
import type { AgentRole } from "@/lib/replay/types";

const VALID: AgentRole[] = ["planner", "researcher", "navigator", "validator"];

export const Route = createFileRoute("/api/public/replay")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const agentParam = url.searchParams.get("agent");
        const agent = agentParam && (VALID as string[]).includes(agentParam)
          ? (agentParam as AgentRole)
          : undefined;
        const timeline = buildTimeline(replayEvents(agent));
        return Response.json({ timeline });
      },
    },
  },
});
