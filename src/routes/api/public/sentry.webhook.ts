/**
 * Sentry webhook → durable queue (real-time entry point).
 *
 * Public route (auth-bypassed at the edge) — signature-verified in-handler.
 * The handler ONLY verifies + enqueues; the AI SRE pipeline runs from the
 * queue worker (`processSentryWebhookQueue`) so no event is lost on crash
 * and Sentry never times out waiting for analysis.
 */
import { createFileRoute } from "@tanstack/react-router";
import { verifySentryWebhook } from "@/lib/sre/pipeline/verify-webhook";
import { enqueueSentryWebhook, processSentryWebhookQueue } from "@/lib/webhooks/queue.server";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, sentry-hook-signature, sentry-hook-resource",
} as const;

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

export const Route = createFileRoute("/api/public/sentry/webhook")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        const raw = await request.text();
        const signature = request.headers.get("sentry-hook-signature");
        const resource = request.headers.get("sentry-hook-resource") ?? "";
        const secret = process.env.SENTRY_WEBHOOK_SECRET;

        const verified = verifySentryWebhook(raw, signature, secret);
        if (!verified.ok) {
          const status = verified.reason === "no-secret" ? 503 : 401;
          return json(status, { ok: false, reason: verified.reason });
        }

        if (resource !== "issue" && resource !== "event_alert") {
          return json(200, { ok: true, skipped: true, reason: `unsupported-resource:${resource}` });
        }

        let payload: any;
        try {
          payload = JSON.parse(raw);
        } catch {
          return json(400, { ok: false, reason: "invalid-json" });
        }

        const action: string = payload?.action ?? "";
        const issueId: string | undefined =
          payload?.data?.issue?.id ?? payload?.data?.issue_id ?? payload?.data?.event?.issue?.id;

        const okActions = new Set([
          "created",
          "resolved",
          "unresolved",
          "assigned",
          "ignored",
          "triggered",
        ]);
        if (action && !okActions.has(action)) {
          return json(200, { ok: true, skipped: true, reason: `unsupported-action:${action}` });
        }

        try {
          const enq = await enqueueSentryWebhook({
            rawBody: raw,
            eventType: `${resource}.${action || "unknown"}`,
            issueId: issueId ? String(issueId) : null,
            parsed: payload,
          });
          // Kick the worker opportunistically (non-blocking). If it fails,
          // the cron worker picks it up on next tick.
          queueMicrotask(() => {
            void processSentryWebhookQueue({ batchSize: 3 }).catch(() => undefined);
          });
          console.log(
            JSON.stringify({
              evt: "webhook_queued",
              type: `${resource}.${action}`,
              issue: issueId,
              duplicate: enq.duplicate,
            }),
          );
          return json(200, { ok: true, queued: enq.queued, duplicate: enq.duplicate });
        } catch (err) {
          // Persist failure — return 500 so Sentry retries later.
          console.error(
            JSON.stringify({
              evt: "webhook_enqueue_failed",
              type: `${resource}.${action}`,
              issue: issueId,
            }),
          );
          return json(500, { ok: false, reason: "enqueue-failed" });
        }
      },
    },
  },
});
