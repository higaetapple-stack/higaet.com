/**
 * In-memory token-bucket rate limiter.
 *
 * ⚠️ Per-worker isolate state. On Cloudflare Workers each isolate has its own
 * bucket map, so the effective limit is roughly `limit × isolates`. This is
 * acceptable for abuse mitigation but NOT a strict quota. Swap to a Supabase
 * counter or KV/Durable Object for hard limits.
 */
import { LIMITS, rateLimitByKey, type RateLimitOptions } from "@/lib/rate-limit-core";

export type { RateLimitOptions };
export { LIMITS, rateLimitByKey };

export function clientKey(request: Request, extra = ""): string {
  const ip =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "anon";
  return `${ip}::${extra}`;
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
