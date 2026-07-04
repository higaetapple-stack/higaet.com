/**
 * Cron entry — drain the Sentry webhook queue.
 *
 * Called by pg_cron every minute. Auth: Supabase anon key in `apikey`
 * header (bypasses at /api/public/* prefix). Runs a bounded batch and
 * returns counters for observability.
 */
import { createFileRoute } from "@tanstack/react-router";
import { processSentryWebhookQueue } from "@/lib/webhooks/queue.server";

export const Route = createFileRoute("/api/public/webhooks/process")({
  server: {
    handlers: {
      POST: async () => {
        try {
          const result = await processSentryWebhookQueue({ batchSize: 20 });
          console.log(JSON.stringify({ evt: "webhook_queue_drained", ...result }));
          return Response.json({ ok: true, ...result });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return Response.json({ ok: false, error: msg.slice(0, 300) }, { status: 500 });
        }
      },
    },
  },
});
