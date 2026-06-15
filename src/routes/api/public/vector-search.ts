/**
 * B.12 — Vector Knowledge Graph · Public semantic search endpoint.
 *
 * GET /api/public/vector-search?q=...&k=5
 *
 * Response:
 *   {
 *     query: string,
 *     matches: Array<{ path, title, score }>
 *   }
 *
 * Read-only, no PII, no writes — safe under /api/public/* (Lovable
 * bypass-auth prefix). Validates input length to prevent abuse.
 * Server-only deps loaded dynamically inside the handler.
 */

import { createFileRoute } from "@tanstack/react-router";

const MAX_QUERY_LEN = 200;
const DEFAULT_K = 5;
const MAX_K = 10;

export const Route = createFileRoute("/api/public/vector-search")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const q = (url.searchParams.get("q") ?? "").slice(0, MAX_QUERY_LEN);
        const kRaw = Number(url.searchParams.get("k") ?? DEFAULT_K);
        const k = Number.isFinite(kRaw)
          ? Math.max(1, Math.min(MAX_K, Math.floor(kRaw)))
          : DEFAULT_K;

        if (!q.trim()) {
          return Response.json(
            { error: "Missing required `q` query parameter." },
            { status: 400 },
          );
        }

        try {
          const { searchSimilar } = await import("@/lib/vector-index");
          const matches = await searchSimilar(q, k);
          return Response.json({
            query: q,
            matches: matches.map((m) => ({
              path: m.path,
              title: m.title,
              score: Number(m.score.toFixed(4)),
            })),
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Unknown error";
          return Response.json(
            { error: "vector_search_failed", message },
            { status: 500 },
          );
        }
      },
    },
  },
});
