/**
 * B.15 — Conversation Orchestrator
 * ---------------------------------------------------------------
 * Wraps B.11 → B.14 in a session-aware shell. Adds:
 *   - context continuity across turns
 *   - follow-up resolution ("that one", "compare", "more advanced")
 *   - ephemeral session memory
 *
 * Guardrails (B.15 spec):
 *   ❌ never decides routes (B.13 stays authoritative)
 *   ❌ never mutates graph / sitemap / registry
 *   ❌ never persists PII
 *   ✔ pure orchestration layer
 */

import { explainQuery, type AIResponse } from "@/lib/ai-mode/reasoner";
import type { FusionMode } from "@/lib/fusion/hybrid-resolver";
import { ingestMemoryAsync } from "@/lib/memory-graph/ingest";
import {
  getSession,
  updateSession,
  type ConversationState,
  type ConversationTurn,
} from "./types";

type FollowUpKind = "reference" | "comparison" | "refinement" | null;

interface FollowUp {
  kind: FollowUpKind;
  resolved: boolean;
  rewrittenQuery: string;
  contextRoutes: string[];
}

const REF_TOKENS = [" that ", " it ", " this ", " those ", " them "];
const COMPARE_TOKENS = ["compare", "vs", "versus", "difference"];
const REFINE_TOKENS = ["more advanced", "advanced", "simpler", "cheaper", "shorter", "longer", "more like", "similar"];

function detectFollowUp(query: string, session: ConversationState): FollowUp {
  const padded = ` ${query.toLowerCase()} `;
  const lastTurn = session.history[session.history.length - 1];

  const hasRef = REF_TOKENS.some((t) => padded.includes(t));
  const hasCompare = COMPARE_TOKENS.some((t) => padded.includes(t));
  const hasRefine = REFINE_TOKENS.some((t) => padded.includes(t));

  if (hasCompare && session.history.length >= 2) {
    const last2 = session.history.slice(-2);
    return {
      kind: "comparison",
      resolved: true,
      rewrittenQuery: `${query} ${last2.map((t) => t.query).join(" vs ")}`,
      contextRoutes: last2.map((t) => t.route ?? "").filter(Boolean),
    };
  }
  if (hasRef && lastTurn?.query) {
    return {
      kind: "reference",
      resolved: true,
      rewrittenQuery: `${lastTurn.query} ${query}`,
      contextRoutes: lastTurn.route ? [lastTurn.route] : [],
    };
  }
  if (hasRefine && lastTurn?.query) {
    return {
      kind: "refinement",
      resolved: true,
      rewrittenQuery: `${lastTurn.query} ${query}`,
      contextRoutes: lastTurn.route ? [lastTurn.route] : [],
    };
  }
  return { kind: null, resolved: false, rewrittenQuery: query, contextRoutes: [] };
}

export interface ConversationResponse extends AIResponse {
  sessionId: string;
  followUp: {
    kind: FollowUpKind;
    resolved: boolean;
    rewrittenQuery: string;
    contextRoutes: string[];
  };
  contextUsed: boolean;
  turnCount: number;
}

export interface RunConversationOptions {
  mode?: FusionMode;
  limit?: number;
}

export async function runConversation(
  sessionId: string,
  query: string,
  opts: RunConversationOptions = {},
): Promise<ConversationResponse> {
  const session = getSession(sessionId);
  const followUp = detectFollowUp(query, session);

  const effectiveQuery = followUp.resolved ? followUp.rewrittenQuery : query;
  const ai = await explainQuery(effectiveQuery, opts);

  const turn: ConversationTurn = {
    query,
    intent: ai.intentSummary,
    route: ai.primary?.path ?? null,
    timestamp: Date.now(),
  };
  const updated = updateSession(sessionId, turn);

  return {
    ...ai,
    sessionId,
    followUp,
    contextUsed: followUp.resolved,
    turnCount: updated.history.length,
  };
}
