/**
 * Cron entry — drain the Sentry webhook queue.
 *
 * Called by pg_cron every minute. Auth: Supabase anon key in `apikey`
 * header, verified with a timing-safe compare against
 * SUPABASE_PUBLISHABLE_KEY. Matches the pattern in cron/embeddings.ts.
 */
import { createFileRoute } from "@tanstack/react-router";
import { timingSafeEqual } from "crypto";
import { processSentryWebhookQueue } from "@/lib/webhooks/queue.server";

function apiKeyOk(presented: string, expected: string): boolean {
  if (!presented || !expected) return false;
  const a = Buffer.from(presented);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export const Route = createFileRoute("/api/public/webhooks/process")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const presented = request.headers.get("apikey") ?? "";
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY ?? "";
        if (!apiKeyOk(presented, expected)) {
          return new Response("Unauthorized", { status: 401 });
        }
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
