# Cache Invalidation Rules

The readiness cache (`test-results/readiness/cache.json`) is reused by
`phase-2-2-authorization.yml` to skip live readiness probes when a recent
GO result already exists. Invalidation guarantees the cache cannot
authorize deployment after meaningful drift.

## Cache key generation

Computed in `cacheKey()` inside `scripts/check-staging-readiness.ts`:

```
sha256(
  ".github/workflows/staging-readiness.yml:" + sha256(file) + "|" +
  "scripts/check-staging-readiness.ts:"      + sha256(file) + "|" +
  "secrets:SSH_HOST,SSH_KEY,SSH_USER,STAGING_BASE_URL,STAGING_HOST"
) // first 16 hex chars
```

The same key is recomputed in the `cache-check` job of
`phase-2-2-authorization.yml` and compared to the cached value.

## Cache hit requirements (all must hold)

1. `cache.json` exists.
2. `status == "GO"`.
3. `age < READINESS_CACHE_TTL_HOURS` (default `24`).
4. `cache_key == current_key`.

Any failure forces a live readiness run.

## Invalidation events

| Event | Mechanism |
| --- | --- |
| `staging-readiness.yml` modified | File hash changes → `cache_key` mismatch → cache miss |
| `scripts/check-staging-readiness.ts` modified | File hash changes → `cache_key` mismatch → cache miss |
| Required secret list changes | Update the literal list in `cacheKey()` and in `phase-2-2-authorization.yml` `cache-check` (`REQUIRED=`); commit changes hashes → cache miss |
| Repo variable change (`STAGING_EXPECTED_IP`, `DEPLOY_DIR`, `READINESS_CACHE_TTL_HOURS`) | Live run on next dispatch; for immediate invalidation delete `cache.json` in the same commit |
| TTL expiration | `AGE >= TTL_HOURS` → cache miss |
| `status != "GO"` | Cache never reused |

## Validation logic (gate cache-check)

```bash
STATUS=$(jq -r .status cache.json)
TS=$(jq -r .timestamp cache.json)
CACHED_KEY=$(jq -r .cache_key cache.json)
AGE=$(( ( $(date -u +%s) - $(date -u -d "$TS" +%s) ) / 3600 ))
CURRENT_KEY=<recomputed from workflow + checker + REQUIRED secret list>

if [ "$STATUS" = "GO" ] \
   && [ "$AGE" -lt "$TTL_HOURS" ] \
   && [ "$CACHED_KEY" = "$CURRENT_KEY" ]; then
  cache_hit=true
fi
```

## Operational guidance

- Keep TTL between **6 and 24 hours**. Shorter TTLs reduce stale-result
  risk; longer TTLs reduce noise from cron-driven re-runs.
- When the required secret list changes, update **both** the script and
  the gate's `REQUIRED` shell variable in the same commit so the hashes
  agree.
- Never hand-edit `cache.json` — delete it instead, the next readiness
  run will regenerate it.
