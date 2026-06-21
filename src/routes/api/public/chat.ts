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
import { runConversation } from "@/lib/conversation/orchestrator";
import { resetSession } from "@/lib/conversation/types";
import type { FusionMode } from "@/lib/fusion/hybrid-resolver";
import { LIMITS, rateLimit } from "@/lib/server/rate-limit";

const MAX_QUERY_LEN = 500;
const MAX_K = 10;
const MAX_SESSION_LEN = 128;
const VALID_MODES = new Set<FusionMode>(["OFF", "SOFT", "FULL"]);
const SAFE_SESSION = /^[A-Za-z0-9_-]+$/;

interface ChatInput {
  sessionId: string;
  q: string;
  mode: FusionMode;
  limit: number;
  reset: boolean;
}

function badRequest(message: string) {
  return Response.json({ error: message }, { status: 400 });
}

function parseShared(
  sessionIdRaw: string,
  qRaw: string,
  modeRaw: string,
  kRaw: string,
  resetRaw: string,
): ChatInput | Response {
  const sessionId = sessionIdRaw.slice(0, MAX_SESSION_LEN);
  if (!sessionId || !SAFE_SESSION.test(sessionId)) {
    return badRequest("Invalid `sessionId` (alphanum, _-, ≤128 chars).");
  }
  const q = qRaw.slice(0, MAX_QUERY_LEN);
  const modeParam = (modeRaw || "SOFT").toUpperCase() as FusionMode;
  const mode: FusionMode = VALID_MODES.has(modeParam) ? modeParam : "SOFT";
  const kNum = Number(kRaw || 5);
  const limit = Number.isFinite(kNum) ? Math.max(1, Math.min(MAX_K, Math.floor(kNum))) : 5;
  const reset = resetRaw === "1" || resetRaw === "true";
  return { sessionId, q, mode, limit, reset };
}

async function handle(input: ChatInput): Promise<Response> {
  if (input.reset) {
    resetSession(input.sessionId);
    return Response.json({ sessionId: input.sessionId, reset: true });
  }
  if (!input.q.trim()) {
    return badRequest("Missing required `q` query parameter.");
  }
  try {
    const result = await runConversation(input.sessionId, input.q, {
      mode: input.mode,
      limit: input.limit,
    });
    return Response.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: "chat_failed", message }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/public/chat")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const parsed = parseShared(
          url.searchParams.get("sessionId") ?? "",
          url.searchParams.get("q") ?? "",
          url.searchParams.get("mode") ?? "",
          url.searchParams.get("k") ?? "",
          url.searchParams.get("reset") ?? "",
        );
        if (parsed instanceof Response) return parsed;
        return handle(parsed);
      },
      POST: async ({ request }) => {
        let body: Record<string, unknown> = {};
        try {
          body = (await request.json()) as Record<string, unknown>;
        } catch {
          return badRequest("Invalid JSON body.");
        }
        const parsed = parseShared(
          String(body.sessionId ?? ""),
          String(body.q ?? ""),
          String(body.mode ?? ""),
          String(body.k ?? body.limit ?? ""),
          String(body.reset ?? ""),
        );
        if (parsed instanceof Response) return parsed;
        return handle(parsed);
      },
    },
  },
});
