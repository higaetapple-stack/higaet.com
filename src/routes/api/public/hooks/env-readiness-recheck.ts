/**
 * Scheduled recheck for env readiness.
 *
 * Called every 15 minutes by pg_cron via net.http_post with the anon
 * `apikey` header. This route lives under /api/public/*, so Lovable's
 * published-site auth is bypassed; we still gate writes on the apikey
 * matching SUPABASE_PUBLISHABLE_KEY to reject arbitrary internet callers.
 *
 * Presence-only: never reads or stores secret values.
 */
import { createFileRoute } from "@tanstack/react-router";
import { timingSafeEqual } from "crypto";
import { computeEnvReadiness } from "@/lib/env-readiness.functions";

function verifyApiKey(header: string | null): boolean {
  const expected = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!expected || !header) return false;
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export const Route = createFileRoute("/api/public/hooks/env-readiness-recheck")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!verifyApiKey(request.headers.get("apikey"))) {
          return new Response("unauthorized", { status: 401 });
        }

        const report = computeEnvReadiness();
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: prev } = await supabaseAdmin
          .from("env_readiness_snapshots")
          .select("overall")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const { error: insertErr } = await supabaseAdmin
          .from("env_readiness_snapshots")
          .insert({
            environment: report.environment,
            overall: report.overall,
            present_count: report.totals.present,
            missing_count: report.totals.missing,
            malformed_count: report.totals.malformed,
            blocking_missing_count: report.totals.blockingMissing,
            totals: report.totals,
            groups: report.groups,
            source: "cron",
          });
        if (insertErr) {
          return Response.json({ ok: false, error: insertErr.message }, { status: 500 });
        }

        let stateChanged = false;
        if (prev?.overall && prev.overall !== report.overall) {
          stateChanged = true;
          await supabaseAdmin.from("env_readiness_activity").insert({
            user_id: null,
            event_type: "state_changed",
            previous_overall: prev.overall,
            next_overall: report.overall,
            detail: { source: "cron", totals: report.totals },
          });
        }

        return Response.json({
          ok: true,
          overall: report.overall,
          stateChanged,
          totals: report.totals,
        });
      },
    },
  },
});
