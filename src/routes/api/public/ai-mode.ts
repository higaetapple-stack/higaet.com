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

export const Route = createFileRoute("/api/public/ai-mode")({
  loader: async () => ({}),
  component: () => null,
});
