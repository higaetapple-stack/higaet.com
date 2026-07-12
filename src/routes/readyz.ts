import { createFileRoute } from "@tanstack/react-router";

// Readiness probe — verifies the SSR worker has the minimum config it needs
// to serve real traffic (Supabase publishable env vars baked at build time).
// Returns 503 with a JSON breakdown when a required var is missing so the
// hosting layer / Passenger can withhold the instance from the pool.
const REQUIRED_ENV = [
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
] as const;

export const Route = createFileRoute("/readyz")({
  server: {
    handlers: {
      GET: async () => {
        const checks: Record<string, "ok" | "missing"> = {};
        let ready = true;
        for (const name of REQUIRED_ENV) {
          const present = Boolean(process.env[name]);
          checks[name] = present ? "ok" : "missing";
          if (!present) ready = false;
        }
        const body = {
          status: ready ? ("ready" as const) : ("degraded" as const),
          checks,
          timestamp: new Date().toISOString(),
        };
        return new Response(JSON.stringify(body), {
          status: ready ? 200 : 503,
          headers: {
            "content-type": "application/json",
            "cache-control": "no-store",
          },
        });
      },
    },
  },
});
