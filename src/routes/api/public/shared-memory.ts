import { createFileRoute } from "@tanstack/react-router";
import { readMemory } from "@/lib/shared-memory/query";

export const Route = createFileRoute("/api/public/shared-memory")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const scope = url.searchParams.get("scope") ?? "global";
        return Response.json({ scope, memory: readMemory(scope) });
      },
    },
  },
});
