/**
 * Sentry webhook → AI SRE pipeline (real-time entry point).
 *
 * Public route (auth-bypassed at the edge) — signature-verified in-handler.
 * Only `issue.*` resource events trigger analysis; everything else is a
 * silent 200 so Sentry doesn't retry.
 *
 * Never calls runAISRELoop or the PR generator directly — every path funnels
 * through processSentryIssue so we can never double-analyze or double-suggest.
 */
import { createFileRoute } from "@tanstack/react-router";
import { verifySentryWebhook } from "@/lib/sre/pipeline/verify-webhook";
import { processSentryIssue } from "@/lib/sre/pipeline/process-issue.server";

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
          // 401 on real signature failure; 500-shape avoided on config gaps so
          // Sentry doesn't retry-flood on a misconfigured secret.
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

        if (!issueId) {
          return json(200, { ok: true, skipped: true, reason: "no-issue-id" });
        }
        const okActions = new Set(["created", "resolved", "unresolved", "assigned", "ignored", "triggered"]);
        if (action && !okActions.has(action)) {
          return json(200, { ok: true, skipped: true, reason: `unsupported-action:${action}` });
        }

        // Fire the orchestrator. On any failure inside, we still return 200
        // (the analysis row records the failure) so Sentry does not retry.
        const result = await processSentryIssue({ issueId: String(issueId), trigger: "webhook" });
        return json(200, { ok: true, result });
      },
    },
  },
});
