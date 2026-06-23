import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";
import type { LaunchReadinessIngestPayload } from "@/lib/launch-readiness.types";

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export const Route = createFileRoute("/api/public/launch-readiness/ingest")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.LAUNCH_READINESS_INGEST_SECRET;
        if (!secret) {
          return new Response("Ingest disabled", { status: 503 });
        }
        const signature = request.headers.get("x-signature") ?? "";
        const body = await request.text();
        const expected = createHmac("sha256", secret).update(body).digest("hex");
        if (!safeEqual(signature, expected)) {
          return new Response("Invalid signature", { status: 401 });
        }

        let payload: LaunchReadinessIngestPayload;
        try {
          payload = JSON.parse(body);
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }
        if (!payload?.commit_sha || !payload?.branch || !payload?.environment) {
          return new Response("Missing required fields", { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          .from("launch_readiness_runs")
          .insert({
            commit_sha: payload.commit_sha,
            branch: payload.branch,
            environment: payload.environment,
            workflow_run_id: payload.workflow_run_id ?? null,
            audit_errors: payload.audit_errors ?? 0,
            audit_warnings: payload.audit_warnings ?? 0,
            audit_breakdown: payload.audit_breakdown ?? {},
            playwright_passed: payload.playwright_passed ?? 0,
            playwright_failed: payload.playwright_failed ?? 0,
            playwright_skipped: payload.playwright_skipped ?? 0,
            playwright_duration_ms: payload.playwright_duration_ms ?? 0,
            security_passed: payload.security_passed ?? 0,
            security_failed: payload.security_failed ?? 0,
            schema_validation_status: payload.schema_validation_status ?? "unknown",
            schema_validation_details: payload.schema_validation_details ?? {},
            overall_status: payload.overall_status ?? "unknown",
            artifact_urls: payload.artifact_urls ?? {},
          })
          .select("id")
          .single();

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }
        return Response.json({ id: data?.id, ok: true });
      },
    },
  },
});
