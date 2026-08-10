/**
 * B.15 — Conversation Layer · Public chat endpoint.
 *
 * GET  /api/public/chat?sessionId=&q=&mode=SOFT|FULL|OFF&k=5
 * POST /api/public/chat   { sessionId, q, mode?, k?, reset? }
 *
 * Ephemeral, session-aware orchestration over B.11–B.14. No PII
 * stored, no DB writes. Safe under /api/public/* (bypass-auth prefix).
 * Routing decisions stay with B.13; B.15 only manages continuity.
 */

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/chat")({
  loader: async () => ({}),
  component: () => null,
});
