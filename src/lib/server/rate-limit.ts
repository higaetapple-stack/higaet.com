/**
 * In-memory token-bucket rate limiter.
 *
 * ⚠️ Per-worker isolate state. On Cloudflare Workers each isolate has its own
 * bucket map, so the effective limit is roughly `limit × isolates`. This is
 * acceptable for abuse mitigation but NOT a strict quota. Swap to a Supabase
 * counter or KV/Durable Object for hard limits.
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

export function clientKey(request: Request, extra = ""): string {
  const ip =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "anon";
  return `${ip}::${extra}`;
}

/**
 * Core token-bucket check against an explicit key.
 * Returns null when allowed, or { retryAfterSec } when the bucket is empty.
 * Pure key logic (no Request dependency) so server functions that only have
 * header access can share the same buckets. Never throws and never exposes
 * internals beyond a retry hint for headers the caller chooses to set.
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

/** Returns null when allowed, or a Response (429) when blocked. */
export function rateLimit(request: Request, opts: RateLimitOptions): Response | null {
  const blocked = rateLimitByKey(`${opts.name}::${clientKey(request)}`, opts);
  if (!blocked) return null;
  return new Response(
    JSON.stringify({ error: "rate_limited", retryAfter: blocked.retryAfterSec }),
    {
      status: 429,
      headers: {
        "content-type": "application/json",
        "retry-after": String(blocked.retryAfterSec),
        "x-ratelimit-limit": String(opts.limit),
        "x-ratelimit-remaining": "0",
        "x-ratelimit-reset": String(Math.floor(Date.now() / 1000) + blocked.retryAfterSec),
      },
    },
  );
}

/** Preset limits for the AI/governance endpoints. */
export const LIMITS = {
  chat: { name: "chat", limit: 20, windowMs: 60_000 },
  agentRun: { name: "agent.run", limit: 10, windowMs: 60_000 },
  multiAgent: { name: "multi-agent", limit: 5, windowMs: 60_000 },
  vectorSearch: { name: "vector-search", limit: 30, windowMs: 60_000 },
  publicDefault: { name: "public", limit: 60, windowMs: 60_000 },
  /** Public lead form: generous for humans (multi-tab retries), tight for floods. */
  leadSubmit: { name: "lead.submit", limit: 5, windowMs: 600_000 },
} as const;
