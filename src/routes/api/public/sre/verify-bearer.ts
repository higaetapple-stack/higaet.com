/**
 * SRE E2E bearer verification endpoint.
 *
 * Accepts POST with `Authorization: Bearer <token>` and returns only a
 * boolean match against `SRE_E2E_TRIGGER_SECRET`. The secret value is
 * never echoed, logged, or included in any response — success and
 * failure bodies are fixed shapes.
 *
 * Use it to confirm that the value stored in GitHub as `SRE_E2E_BEARER`
 * matches the server-side `SRE_E2E_TRIGGER_SECRET` without triggering a
 * full E2E run.
 */
import { createFileRoute } from "@tanstack/react-router";
import { timingSafeEqual } from "crypto";

function safeEqual(expected: string, provided: string | null): boolean {
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export const Route = createFileRoute("/api/public/sre/verify-bearer")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env.SRE_E2E_TRIGGER_SECRET;
        if (!expected) {
          return Response.json(
            { ok: false, configured: false, match: false },
            { status: 503 },
          );
        }
        const bearer =
          request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;
        const match = safeEqual(expected, bearer);
        return Response.json(
          { ok: match, configured: true, match },
          { status: match ? 200 : 401 },
        );
      },
    },
  },
});
