/**
 * Public trigger for the SRE end-to-end smoke test.
 *
 * Called by the sre-e2e.yml GitHub Actions workflow. Auth is a shared
 * secret (SRE_E2E_TRIGGER_SECRET) passed as a bearer token — the same
 * value must be stored in the repo as the SRE_E2E_BEARER secret.
 *
 * If the secret is not configured on the server, the endpoint 503s so a
 * misconfigured workflow fails loudly instead of silently running.
 *
 * Production monitoring should alert on this endpoint returning 503, and
 * on the sibling /api/public/sre/e2e-health returning 503.
 */
import { createFileRoute } from "@tanstack/react-router";
import { timingSafeEqual } from "crypto";
import { runSreE2ETest } from "@/lib/sre/pipeline/e2e-test.server";
import { sanitizeGithubError } from "@/lib/github/sanitize";

function verify(expected: string, provided: string | null): boolean {
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export const Route = createFileRoute("/api/public/sre/e2e-trigger")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env.SRE_E2E_TRIGGER_SECRET;
        const environment = process.env.NODE_ENV ?? "unknown";
        const timestamp = new Date().toISOString();

        if (!expected) {
          console.warn(
            JSON.stringify({
              evt: "sre_trigger_health",
              configured: false,
              environment,
              timestamp,
              message: "SRE_E2E_TRIGGER_SECRET not configured",
            }),
          );
          return Response.json(
            { ok: false, error: "SRE_E2E_TRIGGER_SECRET not configured" },
            { status: 503 },
          );
        }

        const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;
        if (!verify(expected, bearer)) {
          return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
        }

        console.log(
          JSON.stringify({
            evt: "sre_trigger_health",
            configured: true,
            environment,
            timestamp,
          }),
        );

        try {
          const result = await runSreE2ETest({ triggeredBy: null });
          // passed → 200, pending → 200 (workflow warns), failed → 500
          const httpStatus = result.status === "failed" ? 500 : 200;
          return Response.json(result, { status: httpStatus });
        } catch (err) {
          const msg = sanitizeGithubError(err);
          return Response.json({ ok: false, error: msg }, { status: 500 });
        }
      },
    },
  },
});

