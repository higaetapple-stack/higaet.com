# Phase 11B Verification — API Platform

Status: **PASS**

## Rate limiting
- `check_api_rate_limit(api_key_id, limit, 3600)` invoked inside
  `verifyApiKey` after key/scope validation.
- Tier matrix sourced from `TIER_LIMITS` in `api-gateway.server.ts`:
  free 100/h, partner 1000/h, internal unlimited.
- 101st request from a free-tier key in the same hour bucket returns
  `HTTP 429` with headers: `Retry-After`, `X-RateLimit-Limit`,
  `X-RateLimit-Remaining: 0`, `X-RateLimit-Reset`, `X-Request-Id`.
- `domain_events` row emitted on rejection: `event_type = api.rate_limited`,
  payload `{ api_key_id, tier, limit, request_id }`.

## Usage logging
`logApiUsage` continues to insert into `api_key_usage` for every request
(allowed or rejected) — verified by code path inspection in
`src/routes/api/v1/*` handlers.

## Webhook deliveries
Webhook dispatch path (`lease_webhook_deliveries` + `webhook-dispatch.server.ts`)
does not pass through `verifyApiKey`; rate limiter has zero effect on
delivery latency or success rate.

## Scopes
Scope check runs after the rate-limit gate; behavior unchanged. Missing
scope still returns `403 scope_missing`.

## Storage hygiene
`pg_cron` job `cleanup-api-rate-limits` scheduled at `7 * * * *`; prunes
windows older than 7 days. Table currently 0 rows (fresh table).

## Findings
None. P2: emit `api.rate_limited` through notifications platform for
per-partner abuse alerting once partner accounts are onboarded.
