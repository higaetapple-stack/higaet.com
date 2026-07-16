# Readiness Result Cache

The readiness checker writes a cache file at `test-results/readiness/cache.json`
on every run. The Phase 2.2 Authorization workflow consults it before
re-running the full readiness probes.

## Cache schema

```json
{
  "run_id": "12345678",
  "timestamp": "2026-06-23T12:00:00.000Z",
  "status": "GO",
  "artifact_url": "https://github.com/<owner>/<repo>/actions/runs/<id>#artifacts",
  "report_url": "https://github.com/<owner>/<repo>/blob/main/docs/infrastructure/phase-2-2-prerequisite-report.md",
  "run_url": "https://github.com/<owner>/<repo>/actions/runs/<id>",
  "evidence_dir": "test-results/readiness/<timestamp>",
  "ttl_hours": 24
}
```

## TTL

- Default: **24 hours**.
- Override via repo variable `READINESS_CACHE_TTL_HOURS` (recommended 6–24h).
- Authorization reuses the cache only when `status == "GO"` AND `age < TTL`.

## Invalidation

The cache is implicitly invalidated when any of the following happens
(GitHub Actions reruns the readiness workflow rather than reusing cache):

1. `staging-readiness.yml` is modified (cache file is regenerated on the next run).
2. Required secret definitions change (next live run overwrites cache).
3. `STAGING_EXPECTED_IP` / `DEPLOY_DIR` repo variables change.
4. The cache file is missing or older than TTL.

For belt-and-suspenders invalidation, delete `test-results/readiness/cache.json`
in the same commit that changes infrastructure configuration.

## Authorization behavior

```
cache-check  ──► cache_hit? ──► gate (uses cached GO, skips live probes)
                    │
                    └► no ──► authorize (live readiness run) ──► gate
```

This keeps the GO path fast while preventing stale results from
authorizing deployment after infrastructure drift.
