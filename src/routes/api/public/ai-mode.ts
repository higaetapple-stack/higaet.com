/**
 * B.14 — AI Mode · Public reasoning endpoint.
 *
 * GET /api/public/ai-mode?q=...&mode=SOFT|FULL|OFF&k=5
 *
 * Returns an explainable response over B.11/B.12/B.13. Read-only, no
 * PII, no writes — safe under /api/public/* (Lovable bypass-auth prefix).
 * Interpretation only — never overrides B.13 routing decisions.
 */

import { createFileRoute } from "@tanstack/react-router";
import { explainQuery } from "@/lib/ai-mode/reasoner";
import type { FusionMode } from "@/lib/fusion/hybrid-resolver";

const MAX_QUERY_LEN = 200;
const MAX_K = 10;
const VALID_MODES = new Set<FusionMode>(["OFF", "SOFT", "FULL"]);

export const Route = createFileRoute("/api/public/ai-mode")({
  loader: async () => ({}),
  component: () => null,
});
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
          const response = await explainQuery(q, { mode, limit });
          return Response.json(response);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Unknown error";
          return Response.json(
            { error: "ai_mode_failed", message },
            { status: 500 },
          );
        }
      },
    },
  },
});
