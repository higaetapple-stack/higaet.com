# Phase 2.3 — Staging Soak Plan

Long-duration validation that staging behaves under continuous load with realistic provider mix. Pre-execution document; live run begins only after Phase 2.2 returns GO.

## Duration

- **Minimum:** 24 hours continuous.
- **Preferred:** 48 hours, covering one full UK + IST business cycle.
- **Workload driver:** `scripts/run-soak.ts` (architecture in `phase-2-1-soak-runner-report.md`).

## Metrics

Collected per lane (`chat.fast`, `chat.reason`, `chat.cheap`, `chat.tools`, `embeddings`) and aggregated hourly into `public.ai_usage`.

| Metric | Source |
| --- | --- |
| p50 latency | per-call `latency_ms` |
| p95 latency | per-call `latency_ms` |
| p99 latency | per-call `latency_ms` |
| Provider success rate | `status='success'` / total |
| Provider fallback rate | calls where final provider ≠ primary, per lane |
| Circuit breaker events | breaker `open` / `half_open` / `close` counts |
| Quota errors | 429 / quota-exceeded events |
| Queue backlog | `ai_embeddings_queue` rows in `pending` + `processing` |
| Embedding failures | queue rows transitioning to `failed` or `dead` |
| Retrieval failures | RAG calls returning 0 chunks for seed queries |

## Exit Criteria

| Metric | PASS threshold | FAIL threshold |
| --- | --- | --- |
| chat.fast p95 | ≤ 3.0 s | > 5.0 s |
| chat.reason p95 | ≤ 8.0 s | > 12.0 s |
| chat.cheap p95 | ≤ 3.0 s | > 5.0 s |
| chat.tools p95 | ≤ 6.0 s | > 10.0 s |
| embeddings p95 | ≤ 4.0 s | > 6.0 s |
| Success rate (all lanes) | ≥ 99.0% | < 98.0% |
| Fallback rate (chat.fast) | ≤ 25% | > 50% |
| Circuit breaker | ≥ 1 open + auto-close | open with no recovery |
| Quota errors | bounded (< 1% of calls) | unbounded growth |
| Queue backlog | bounded and drains each hour | monotonic growth |
| Embedding failures | < 0.5% net after retries | > 2% |
| Retrieval failures | 0 on seed queries | any |

## Pass / Fail Decision

- **PASS:** every row meets its PASS threshold for the final 12 h of the run.
- **CONDITIONAL PASS:** ≤ 2 metrics in the warn band (between PASS and FAIL) → remediate and re-run a 12 h confirmation.
- **FAIL:** any row hits a FAIL threshold → analysis + remediation + full 24 h re-run.

## Recording

Outputs land in `docs/infrastructure/phase-2-3-soak-report.md` (created post-run) plus the `provider-health` dashboard snapshot at start, midpoint, and end of the soak window.
