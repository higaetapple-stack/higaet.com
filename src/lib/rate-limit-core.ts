/**
 * Pure in-memory token-bucket primitives shared by server-only request
 * helpers (src/lib/server/rate-limit.ts) and isomorphic server functions.
 *
 * Lives outside `server/` on purpose: TanStack Start import-protection
 * denies imports under any server directory from the client bundle, and server
 * functions are part of the client module graph.
 *
 * Storage is process-local: on the single Passenger Node process this is
 * one shared map. Fail-open by design — callers must never let a limiter
 * error block legitimate traffic.
 */
type Bucket = { tokens: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export interface RateLimitOptions {
  /** Logical bucket name, e.g. "chat" */
  name: string;
  /** Allowed requests per window */
  limit: number;
  /** Window in ms */
  windowMs: number;
}

/**
 * Core token-bucket check against an explicit key.
 * Returns null when allowed, or { retryAfterSec } when the bucket is empty.
 * Never throws and never exposes internals beyond a retry hint for headers
 * the caller chooses to set.
 */
export function rateLimitByKey(
  key: string,
  opts: RateLimitOptions,
): { retryAfterSec: number } | null {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || now >= b.resetAt) {
    b = { tokens: opts.limit, resetAt: now + opts.windowMs };
    buckets.set(key, b);
  }
  if (b.tokens <= 0) {
    return { retryAfterSec: Math.ceil((b.resetAt - now) / 1000) };
  }
  b.tokens -= 1;
  return null;
}

/** Preset limits. */
export const LIMITS = {
  chat: { name: "chat", limit: 20, windowMs: 60_000 },
  agentRun: { name: "agent.run", limit: 10, windowMs: 60_000 },
  multiAgent: { name: "multi-agent", limit: 5, windowMs: 60_000 },
  vectorSearch: { name: "vector-search", limit: 30, windowMs: 60_000 },
  publicDefault: { name: "public", limit: 60, windowMs: 60_000 },
  /** Public lead form: generous for humans (multi-tab retries), tight for floods. */
  leadSubmit: { name: "lead.submit", limit: 5, windowMs: 600_000 },
} as const;
