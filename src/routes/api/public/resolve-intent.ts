/**
 * B.11 — AI Query Router · Public resolver endpoint.
 *
 * GET /api/public/resolve-intent?q=...
 *
 * Response:
 *   {
 *     query: string,
 *     match: { path, title, intent, confidence } | null,
 *     alternatives: Array<{ path, title, confidence }>
 *   }
 *
 * Read-only, no PII, no writes — safe under /api/public/* (Lovable
 * bypass-auth prefix). Validates input length to prevent abuse.
 */

import { createFileRoute } from "@tanstack/react-router";
import { resolveIntentRanked } from "@/lib/intent-router/resolve";

const MAX_QUERY_LEN = 200;

export const Route = createFileRoute("/api/public/resolve-intent")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const q = (url.searchParams.get("q") ?? "").slice(0, MAX_QUERY_LEN);

        if (!q.trim()) {
          return Response.json(
            { error: "Missing required `q` query parameter." },
            { status: 400 },
          );
        }

        const ranked = resolveIntentRanked(q, 4);
        const [best, ...rest] = ranked;

        return Response.json({
          query: q,
          match: best
            ? {
                path: best.node.path,
                title: best.node.title,
                intent: best.node.intent,
                confidence: Number(best.confidence.toFixed(3)),
              }
            : null,
          alternatives: rest.map((r) => ({
            path: r.node.path,
            title: r.node.title,
            confidence: Number(r.confidence.toFixed(3)),
          })),
        });
      },
    },
  },
});
