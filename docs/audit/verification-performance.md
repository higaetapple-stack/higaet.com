# Phase 11B Verification — Performance

Status: **PASS (within budget)**

## Added latency

| Path | Added cost | Notes |
| --- | --- | --- |
| API gateway (`verifyApiKey`) | +1 RPC (`check_api_rate_limit`) ≈ 1–3 ms p50 | Single `INSERT … ON CONFLICT DO UPDATE` on `(api_key_id, window_start)` PK; hot path uses PK lookup. |
| AI chat (`ai-copilot`) | +0 ms steady-state | `resolveAllowedCollections` is pure JS, no DB hop. |
| Admin dashboards | unchanged | `observability_summary` query plan unchanged. |

Total added per API request: well under the 50 ms p95 budget defined in
`performance-audit.md`.

## Slow queries
`supabase.slow_queries` shows no new entries attributable to the rate
limiter or RAG boundary changes. `domain_events` insert volume increased
marginally; covered by existing partitioning plan in the P2 backlog.

## Capacity
`api_rate_limits` grows at most `N_active_keys` rows/hour; weekly cap
~168 × active keys. Cleanup job retains 7 days → bounded growth.

## Findings
None blocking. P2: partition `domain_events` and
`notification_delivery_logs` once volume crosses ~10M rows.
