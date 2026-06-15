/**
 * B.16 — Persistent Memory Graph · Public read-only endpoint.
 *
 * GET /api/public/memory-graph?limit=100
 *
 * Returns aggregated, anonymized intent→route frequency snapshot.
 * Read-only. No PII. Safe under /api/public/* (bypass-auth prefix).
 */

import { createFileRoute } from "@tanstack/react-router";
import { snapshotMemoryGraph } from "@/lib/memory-graph/ingest";

const MAX_LIMIT = 500;

export const Route = createFileRoute("/api/public/memory-graph")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const limitRaw = Number(url.searchParams.get("limit") ?? 100);
        const limit = Number.isFinite(limitRaw)
          ? Math.max(1, Math.min(MAX_LIMIT, Math.floor(limitRaw)))
          : 100;
        return Response.json(snapshotMemoryGraph(limit));
      },
    },
  },
});
