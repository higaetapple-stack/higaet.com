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

/** Returns null when allowed, or a Response (429) when blocked. */
export function rateLimit(
  request: Request,
  opts: RateLimitOptions,
): Response | null {
  const key = `${opts.name}::${clientKey(request)}`;
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || now >= b.resetAt) {
    b = { tokens: opts.limit, resetAt: now + opts.windowMs };
    buckets.set(key, b);
  }
  if (b.tokens <= 0) {
    const retryAfter = Math.ceil((b.resetAt - now) / 1000);
    return new Response(
      JSON.stringify({ error: "rate_limited", retryAfter }),
      {
        status: 429,
        headers: {
          "content-type": "application/json",
          "retry-after": String(retryAfter),
          "x-ratelimit-limit": String(opts.limit),
          "x-ratelimit-remaining": "0",
          "x-ratelimit-reset": String(Math.floor(b.resetAt / 1000)),
        },
      },
    );
  }
  b.tokens -= 1;
  return null;
}

/** Preset limits for the AI/governance endpoints. */
export const LIMITS = {
  chat: { name: "chat", limit: 20, windowMs: 60_000 },
  agentRun: { name: "agent.run", limit: 10, windowMs: 60_000 },
  multiAgent: { name: "multi-agent", limit: 5, windowMs: 60_000 },
  vectorSearch: { name: "vector-search", limit: 30, windowMs: 60_000 },
  publicDefault: { name: "public", limit: 60, windowMs: 60_000 },
} as const;
