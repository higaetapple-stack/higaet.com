# HIGAET — Performance Audit (Phase 11A)

_Date: 2026-06-22 · Mode: read-only_

## 1. Database

`pg_stat_statements` snapshot (top app queries, excluding migrations):

| Query | Calls | Mean | Total |
|---|---|---|---|
| `scholarships` list w/ lateral joins (PostgREST) | 57 | 0.97 ms | 55 ms |
| `profiles` by id (header user fetch) | 50 | 0.32 ms | 16 ms |
| `user_roles` by user_id | 37 | 0.35 ms | 13 ms |

All sub-millisecond — **no current hot spot**. This reflects low traffic; re-baseline post-launch.

### Indexing review

- `scholarships(country_id)`, `scholarships(university_id)` — verify indexes exist (lateral joins). Likely OK via FK btree.
- `application_status_history(application_id, created_at desc)` — needed for student timeline.
- `notifications(user_id, read_at, archived_at)` — needed for `notifications_unread_count`.
- `ai_chunks` HNSW index on `embedding` — confirm via `\d ai_chunks` (used by `match_ai_chunks`).
- `domain_events(event_type, created_at desc)` — needed for admin reads.
- `system_metrics(kind, recorded_at)` — needed for `observability_summary` percentile.

**Action P2:** generate an `EXPLAIN ANALYZE` for each of the above and add missing indexes via migration.

### Queue / growth tables

| Table | Risk |
|---|---|
| `domain_events` | Append-only. Add monthly partition or TTL after 12 months. P2 |
| `notification_delivery_logs` | Add 90-day TTL. P2 |
| `api_webhook_deliveries` | Successful rows can be archived after 30 days. P2 |
| `ai_embeddings_queue` | Should self-drain — alert on backlog > 1000 (already in `system_health`). OK |
| `system_errors`, `system_metrics` | Add 30-day TTL. P2 |
| `api_key_usage` | High write rate post-launch. Roll up to hourly aggregates. P2 |

## 2. N+1 patterns

- `studentTimeline` in `counselor.functions.ts` fans 5 parallel queries — OK.
- `counselorPipeline` groups in JS after a single fetch — OK.
- Risk surface: any route that maps over rows and calls a server fn per row. Spot-checked — none found in current routes.

## 3. Realtime

- Realtime subscriptions used by community threads/replies. Cardinality is low; safe through ~500 concurrent viewers per thread.

## 4. AI latency

- Retrieval (`match_ai_chunks`, k=8) is the hot path. With HNSW it should remain <50 ms at 100k chunks. Re-measure at scale.
- Embedding job runtime governed by external gateway; current queue health visible on `/dashboard/admin/system`.

## 5. Frontend

- Heavy admin dashboards use TanStack Query + `useSuspenseQuery` — good.
- Recommendation: confirm `defaultPreloadStaleTime: 0` in router context (template default).

## 6. Prioritized perf fixes

| ID | Action | Priority |
|---|---|---|
| P1a | Add TTL/partitioning to `domain_events`, `system_errors`, `system_metrics`, `notification_delivery_logs`, `api_webhook_deliveries` | P2 |
| P1b | Add composite indexes per §1 | P2 |
| P1c | Add rollup table `api_key_usage_hourly` | P2 (before public API GA) |
| P1d | Synthetic load test: 50 RPS on `/api/v1/*` + 100 concurrent RAG retrievals | P1 (pre-launch) |
