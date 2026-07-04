/**
 * Cron backfill entry point for the Sentry → AI SRE pipeline.
 *
 * pg_cron POSTs here every N minutes with the anon `apikey` header. Pulls
 * the latest unresolved issues and routes each through the SAME orchestrator
 * as the webhook. Dedup lives inside processSentryIssue, so re-runs are safe.
 */
import { createFileRoute } from "@tanstack/react-router";
import { SentryClient } from "@/lib/sre/ai/sentry-client";
import { processSentryIssue } from "@/lib/sre/pipeline/process-issue.server";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, apikey, Authorization",
} as const;

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

function timingSafeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

export const Route = createFileRoute("/api/public/sentry/sync")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        // pg_cron auth pattern — validate anon key.
        const presented = request.headers.get("apikey") ?? "";
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY ?? "";
        if (!expected || !timingSafeEq(presented, expected)) {
          return json(401, { ok: false, reason: "unauthorized" });
        }

        let body: any = {};
        try {
          body = await request.json();
        } catch {
          body = {};
        }
        const limit = Math.min(Number(body?.limit ?? 25), 100);

        const client = new SentryClient();
        if (!client.isConfigured()) {
          return json(200, { ok: true, skipped: "sentry-not-configured" });
        }

        const issues = await client.listIssues({ limit });
        const results = [] as Array<{ issueId: string; status: string; prSuggested?: boolean }>;
        for (const iss of issues) {
          const r = await processSentryIssue({ issueId: iss.id, trigger: "cron" });
          results.push({ issueId: iss.id, status: r.status, prSuggested: r.prSuggested });
        }

        // Piggyback release sync on the same cron pass — cheap and keeps
        // the releases table warm for the correlation engine.
        let releaseSync: { fetched: number; upserted: number; skipped: number } | null = null;
        try {
          const { syncReleasesFromSentry } = await import("@/lib/releases/sync.server");
          releaseSync = await syncReleasesFromSentry({ client, limit: 25 });
        } catch {
          releaseSync = null;
        }

        return json(200, {
          ok: true,
          scanned: issues.length,
          processed: results.filter((r) => r.status === "processed").length,
          skipped: results.filter((r) => r.status === "skipped").length,
          failed: results.filter((r) => r.status === "failed").length,
          suggestedPRs: results.filter((r) => r.prSuggested).length,
          releaseSync,
          results,
        });
      },
    },
  },
});
