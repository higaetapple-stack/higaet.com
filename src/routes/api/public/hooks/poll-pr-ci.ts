/**
 * Cron entry — poll GitHub CI checks for open AI-generated PRs.
 *
 * Auth: `/api/public/*` bypasses site auth; call with Supabase anon key in
 * `apikey` header from pg_cron for observability.
 */
import { createFileRoute } from "@tanstack/react-router";
import { pollOpenPRChecks } from "@/lib/sre/pipeline/poll-ci.server";

export const Route = createFileRoute("/api/public/hooks/poll-pr-ci")({
  server: {
    handlers: {
      POST: async () => {
        try {
          const result = await pollOpenPRChecks({ batchSize: 25 });
          console.log(JSON.stringify({ evt: "sre_ci_polled", ...result }));
          return Response.json({ ok: true, ...result });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return Response.json({ ok: false, error: msg.slice(0, 300) }, { status: 500 });
        }
      },
    },
  },
});
