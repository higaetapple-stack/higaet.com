/**
 * Cron entry — poll GitHub CI checks for open AI-generated PRs.
 *
 * Auth: Supabase anon key in `apikey` header, verified with a timing-safe
 * compare against SUPABASE_PUBLISHABLE_KEY.
 */
import { createFileRoute } from "@tanstack/react-router";
import { timingSafeEqual } from "crypto";
import { pollOpenPRChecks } from "@/lib/sre/pipeline/poll-ci.server";

function apiKeyOk(presented: string, expected: string): boolean {
  if (!presented || !expected) return false;
  const a = Buffer.from(presented);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export const Route = createFileRoute("/api/public/hooks/poll-pr-ci")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const presented = request.headers.get("apikey") ?? "";
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY ?? "";
        if (!apiKeyOk(presented, expected)) {
          return new Response("Unauthorized", { status: 401 });
        }
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
