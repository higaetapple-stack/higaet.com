/**
 * B.15 — Conversation Layer · Types & Session Model
 * ---------------------------------------------------------------
 * Ephemeral in-RAM session store. No PII, no persistence. Sessions
 * are short-term conversational context only. B.15 NEVER decides
 * routes — that authority stays with B.11/B.13.
 */

export interface ConversationTurn {
  query: string;
  intent?: string;
  route?: string | null;
  timestamp: number;
}

export interface ConversationState {
  sessionId: string;
  history: ConversationTurn[];
  lastIntent?: string;
  lastRoute?: string | null;
  lastEntities?: string[];
}

const MAX_HISTORY = 20;
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 min sliding TTL
const MAX_SESSIONS = 1000;

interface StoredSession {
  state: ConversationState;
  touchedAt: number;
}

const sessionStore = new Map<string, StoredSession>();

function evictIfNeeded() {
  if (sessionStore.size <= MAX_SESSIONS) return;
  // Evict oldest by touchedAt
  const sorted = [...sessionStore.entries()].sort(
    (a, b) => a[1].touchedAt - b[1].touchedAt,
  );
  const toDrop = sorted.slice(0, sessionStore.size - MAX_SESSIONS);
  for (const [k] of toDrop) sessionStore.delete(k);
}

export function getSession(id: string): ConversationState {
  const existing = sessionStore.get(id);
  const now = Date.now();
  if (existing && now - existing.touchedAt < SESSION_TTL_MS) {
    existing.touchedAt = now;
    return existing.state;
  }
  const fresh: ConversationState = { sessionId: id, history: [] };
  sessionStore.set(id, { state: fresh, touchedAt: now });
  evictIfNeeded();
  return fresh;
}

export function updateSession(id: string, turn: ConversationTurn): ConversationState {
  const state = getSession(id);
  state.history.push(turn);
  if (state.history.length > MAX_HISTORY) {
    state.history.splice(0, state.history.length - MAX_HISTORY);
  }
  state.lastIntent = turn.intent ?? state.lastIntent;
  state.lastRoute = turn.route ?? state.lastRoute;
  sessionStore.set(id, { state, touchedAt: Date.now() });
  return state;
}

export function resetSession(id: string): void {
  sessionStore.delete(id);
}

export function __sessionStoreSizeForTests(): number {
  return sessionStore.size;
}
