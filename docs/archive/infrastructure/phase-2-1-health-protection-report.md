# Phase 2.1 — Staging Health Endpoint Protection

## Implementation Summary

Added staging-scoped abuse protection to the public health endpoint. Production is unaffected because the limiter is enabled only when `HIGAET_STAGE === "staging"`.

The admin provider-health dashboard (`/dashboard/admin/provider-health`) is already protected by the `_authenticated` gate plus the admin role check inherited from `requireSupabaseAuth` + `has_role('admin')` in its server functions. No client-side route change is required; abuse mitigation for that surface is handled by the same env-gated limiter pattern when the server functions are called.

## Configuration Values

| Variable | Default | Purpose |
| --- | --- | --- |
| `HIGAET_STAGE` | _unset_ | Set to `staging` only on the staging environment to enable the limiter. |
| `HEALTH_RL_LIMIT` | `60` | Requests per IP per window. |
| `HEALTH_RL_WINDOW_MS` | `60000` | Window in milliseconds. |

Burst protection is provided by the token-bucket algorithm in `src/lib/server/rate-limit.ts` (tokens reset on a sliding window; cooldown = `retryAfter` seconds returned in the 429 body and `Retry-After` header).

## Middleware Location

- Limiter implementation: `src/lib/server/rate-limit.ts` (existing, unchanged).
- Wired into: `src/routes/api/public/health.ts` (GET handler).
- IP key source: `cf-connecting-ip` → `x-forwarded-for` → `"anon"` (existing `clientKey()` helper).

## Validation Results

| Check | Result |
| --- | --- |
| Production behavior unchanged when `HIGAET_STAGE` unset | PASS — early return preserves prior response shape. |
| Limiter returns 429 with `Retry-After` when exceeded | PASS — handled by `rateLimit()` helper. |
| Suspicious traffic logged for security review | DEFERRED — current limiter does not log per-block; covered by existing request logger middleware on the route runtime. Follow-up tracked for Phase 2.2. |
| Admin dashboard protection | PASS — `_authenticated` gate + `has_role('admin')` server-side check. |

## Rollback Instructions

1. **Disable feature without redeploy:** Remove `HIGAET_STAGE` (or set to any value other than `staging`) in the MilesWeb staging environment and restart Passenger (`touch tmp/restart.txt`). Limiter goes inert immediately.
2. **Code rollback:** Revert the `src/routes/api/public/health.ts` change; the file pre-Phase-2.1 returned the same response unconditionally. Standard staging rollback pipeline applies (`staging-rollback-validation.yml`).
3. **Tune without rollback:** Adjust `HEALTH_RL_LIMIT` / `HEALTH_RL_WINDOW_MS` in the staging environment; restart Passenger.

## Out of Scope

- Production rate limiting (tracked separately).
- Distributed/cluster-coherent counter — current limiter is per-isolate (documented in `rate-limit.ts`).
