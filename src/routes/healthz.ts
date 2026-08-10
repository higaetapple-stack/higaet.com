import { createFileRoute } from "@tanstack/react-router";

// Lightweight liveness probe for Passenger / MilesWeb / uptime monitors.
// Intentionally does NOT touch DB, external services, or auth — must be fast
// and side-effect free. Returns 200 as long as the SSR worker is running.
const STARTED_AT = Date.now();

export const Route = createFileRoute("/healthz")({
  loader: async () => ({}),
  component: () => null,
});
      GET: async () => {
        const body = {
          status: "ok" as const,
          service: "higaet",
          uptimeMs: Date.now() - STARTED_AT,
          timestamp: new Date().toISOString(),
        };
        return new Response(JSON.stringify(body), {
          status: 200,
          headers: {
            "content-type": "application/json",
            "cache-control": "no-store",
          },
        });
      },
    },
  },
});
