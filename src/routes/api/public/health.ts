import { createFileRoute } from "@tanstack/react-router";

const STARTED_AT = Date.now();

export const Route = createFileRoute("/api/public/health")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const correlationId =
          request.headers.get("x-correlation-id") ?? crypto.randomUUID();
        const body = {
          status: "ok" as const,
          service: "higaet-frontend",
          environment: import.meta.env.MODE,
          version: import.meta.env.VITE_APP_VERSION ?? "1.0.0",
          uptimeMs: Date.now() - STARTED_AT,
          timestamp: new Date().toISOString(),
          correlationId,
        };
        return new Response(JSON.stringify(body), {
          status: 200,
          headers: {
            "content-type": "application/json",
            "cache-control": "no-store",
            "x-correlation-id": correlationId,
            "access-control-allow-origin": "*",
          },
        });
      },
      OPTIONS: async () =>
        new Response(null, {
          status: 204,
          headers: {
            "access-control-allow-origin": "*",
            "access-control-allow-methods": "GET, OPTIONS",
            "access-control-allow-headers": "Content-Type, X-Correlation-Id",
            "access-control-max-age": "86400",
          },
        }),
    },
  },
});
