/**
 * B.13 — Hybrid Fusion · Public resolver endpoint.
 *
 * GET /api/public/resolve-hybrid?q=...&mode=SOFT|FULL|OFF&k=5
 *
 * Read-only, no PII, no writes — safe under /api/public/* (Lovable
 * bypass-auth prefix). B.11 stays authoritative; vector layer only
 * contributes ranking lift per the FUSION_MODE matrix.
 */

import { createFileRoute } from "@tanstack/react-router";
import { resolveHybrid, type FusionMode } from "@/lib/fusion/hybrid-resolver";

const MAX_QUERY_LEN = 200;
const MAX_K = 10;
const VALID_MODES = new Set<FusionMode>(["OFF", "SOFT", "FULL"]);

export const Route = createFileRoute("/api/public/resolve-hybrid")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const q = (url.searchParams.get("q") ?? "").slice(0, MAX_QUERY_LEN);
        const modeParam = (url.searchParams.get("mode") ?? "SOFT").toUpperCase() as FusionMode;
        const mode: FusionMode = VALID_MODES.has(modeParam) ? modeParam : "SOFT";
        const kRaw = Number(url.searchParams.get("k") ?? 5);
        const limit = Number.isFinite(kRaw)
          ? Math.max(1, Math.min(MAX_K, Math.floor(kRaw)))
          : 5;

        if (!q.trim()) {
          return Response.json(
            { error: "Missing required `q` query parameter." },
            { status: 400 },
          );
        }

        try {
          const { results } = await resolveHybrid(q, { mode, limit });
          const [primary, ...rest] = results;
          return Response.json({
            query: q,
            mode,
            primary: primary
              ? {
                  path: primary.path,
                  title: primary.title,
                  score: Number(primary.score.toFixed(4)),
                  sources: primary.sources,
                }
              : null,
            alternatives: rest.map((r) => ({
              path: r.path,
              title: r.title,
              score: Number(r.score.toFixed(4)),
              sources: r.sources,
            })),
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Unknown error";
          return Response.json(
            { error: "hybrid_resolve_failed", message },
            { status: 500 },
          );
        }
      },
    },
  },
});
