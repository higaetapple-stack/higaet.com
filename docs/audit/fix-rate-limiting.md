# Fix 3 — DB-Backed API Rate Limiting

## Summary
Per-API-key sliding hour-window rate limiting enforced inside
`src/lib/api-gateway.server.ts` via the `check_api_rate_limit` Postgres function.

## Schema
- `api_keys.tier` (`free` | `partner` | `internal`, default `free`)
- `api_rate_limits(api_key_id, window_start, request_count, updated_at)`

## Tiers (hourly)
| Tier     | Limit     |
| -------- | --------- |
| free     | 100/h     |
| partner  | 1000/h    |
| internal | unlimited |

Limits live in `TIER_LIMITS` in `api-gateway.server.ts` — adjust without a migration.

## Response on block
`HTTP 429` with `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`,
`X-RateLimit-Reset`, `X-Request-Id` headers and JSON
`{ error: "rate_limited", retry_after, request_id }`.

## Observability
Each rejection inserts a `domain_events` row with `event_type = "api.rate_limited"`
and payload `{ api_key_id, tier, limit, request_id }`. Existing notification and
webhook fan-out pipelines can subscribe to this event type.

## Storage hygiene
`cleanup_api_rate_limits()` removes windows older than 7 days; scheduled hourly
via `pg_cron` job `cleanup-api-rate-limits` (minute 7).

## Future migration path
The limiter is isolated behind `verifyApiKey` / `check_api_rate_limit`.
Swapping in Redis / Cloudflare KV / Upstash requires changing only the RPC
call site — no API consumer changes.
