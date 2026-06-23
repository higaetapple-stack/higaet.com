# Phase 1.13 — Embedding Pipeline Hardening Report

**Status:** ✅ Implemented (code complete, awaiting live load test)
**Date:** 2026-06-23
**Predecessor:** Phase 1.12 — RAG Resilience Unblock (OpenRouter embedding fallback)
**Successor:** Phase 2.0 — Staging Deployment Readiness Review

---

## 1. Scope Summary

| Area | Before | After |
| --- | --- | --- |
| Max retry attempts | 4 | **10** |
| Retry backoff | Exponential, 1m → 30m cap | Unchanged (now over 10 attempts) |
| Cron OpenAI hard-fail | 500 if `OPENAI_API_KEY` missing | **Removed** — OpenRouter fallback covers |
| Queue visibility (admin UI) | Stats only | **List + filter + per-item detail** |
| Requeue actions | All dead-letter only | **Single, batch, all-dead** (audit logged, confirmed) |
| Alerts | None | **4 thresholds** surfaced live on dashboard |
| Provider attribution | `ai_usage` rows from chat only | Embedding attempts logged via `consumer='embeddings'` (Phase 1.12) |

---

## 2. Queue Architecture — Current Behavior

### Worker (`/api/public/cron/embeddings`)

```
pg_cron (every minute)
  └─> POST /api/public/cron/embeddings  (apikey header)
        ├─ Lease batch (BATCH=5) of {status in (pending,failed), scheduled_for <= now, attempts < 10}
        ├─ For each row:
        │    ├─ status -> "processing", attempts++
        │    ├─ chunkText(doc.content)
        │    ├─ embedTexts() ── OpenAI ─fail→ OpenRouter (Phase 1.12 chain)
        │    │       └─ every attempt → ai_usage (consumer='embeddings')
        │    ├─ replace ai_chunks rows
        │    └─ status -> "completed"  OR  on error:
        │           status -> attempts>=10 ? "dead" : "failed"
        │           scheduled_for = now + min(60s * 2^attempt, 30m)
        │           last_error = err.message
```

### Status transitions

```
queued ─┐
        ├──> pending ──> processing ──┬──> completed
failed ─┘                              └──> failed (scheduled_for shifted)
                                            └──> ...up to 10 attempts...
                                                  └──> dead  (recoverable via requeue)
```

No row is permanently discarded by the worker. `dead` is a holding bucket
for operator review, not data loss.

---

## 3. Failure Testing (logical chain)

Tests were validated against the code paths; full live runtime tests are
deferred to staging ingest (Phase 2.0).

| Test | Setup | Expected | Code result |
| --- | --- | --- | --- |
| **A** OpenAI down | OpenAI returns 429 | OpenRouter fallback in `embedTexts()` succeeds; row → `completed` in one attempt | ✅ Confirmed in `src/lib/ai-embeddings.server.ts` chain (Phase 1.12) |
| **B** OpenRouter down | OpenAI 429, OpenRouter 5xx | All chain entries fail → throw → cron catch → `failed` + backoff, attempts < 10 | ✅ Confirmed in cron catch block |
| **C** Both down sustained | Repeated cron runs all fail | Each cron tick: attempts++ with exponential delay; row stays recoverable until attempts=10 then `dead` | ✅ MAX_ATTEMPTS=10 + backoff ladder verified |
| **D** Provider restored | After failure, OpenAI/OpenRouter back online | Next cron tick at/after `scheduled_for` succeeds; row → `completed` | ✅ Lease filter `scheduled_for <= now()` makes recovery automatic |

**Backoff ladder (minutes since first failure):**
attempt 1: 2m · 2: 4m · 3: 8m · 4: 16m · 5..10: 30m (cap).
Total recoverable window before dead-letter: ≈ 3h 10m.

---

## 4. Data-Loss Analysis

| Failure mode | Risk | Mitigation |
| --- | --- | --- |
| Single provider 429 burst | Was: 4 attempts → dead in ~30m | Now: 10 attempts ≈ 3h window + OpenRouter fallback per attempt |
| Both providers down >3h | Row reaches `dead` | Operator requeues from dashboard; source `ai_documents.content` is the source of truth and is never mutated by failure paths |
| Queue worker crash mid-row | Row left in `processing` | Next cron lease ignores `processing`; operator can requeue manually. (Tracked as residual risk — see §7) |
| Embedding dimension drift | DB write rejects 1536-mismatch vector | `embedTexts()` runtime guard rejects wrong-dim returns before insert; row → `failed` |
| Provider returns garbage | Inserted as valid vector | Out of scope for 1.13; tracked for future content-quality pass |

**Verification:** `ai_documents.content` is the canonical text; cron neither
deletes nor edits it on failure. `ai_chunks` is only replaced after a
successful embed (delete + insert in the same handler block). Recovery
is therefore always possible from source.

---

## 5. Dashboard Validation

Route: `/dashboard/admin/provider-health`
Gate: `_authenticated` + `has_role('admin')` (server-side enforced)

### Tabs

- **Providers** — existing live ping + telemetry (unchanged).
- **Embedding queue** (new):
  - Alert banner (warnings auto-surface from `getEmbeddingAlerts`, 30s refetch)
  - Stats: Pending · Failed · Error rate (1h) · Mins since progress
  - Filter: failed / dead / pending / processing / completed / all
  - Table: title · entity_type · status · attempts · last_error · scheduled_for
  - Actions: Requeue (per row) · Requeue selected (batch) · Requeue all dead
  - Every action: confirmation dialog + audit log row in `public.audit_logs`

### Alert thresholds (configurable in code)

| Code | Threshold | Severity |
| --- | --- | --- |
| `FAILED_HIGH` | > 100 failed rows | warn |
| `PENDING_HIGH` | > 500 pending rows | warn |
| `ERROR_RATE_HIGH` | > 20% embed errors in last 1h (min 10 samples) | critical |
| `QUEUE_STALLED` | backlog > 0 AND no `completed` row in 15m | critical |

---

## 6. Provider Attribution

Per Phase 1.12, every `embedTexts()` attempt writes one `ai_usage` row:

| Column | Value |
| --- | --- |
| `consumer` | `embeddings` |
| `logical_id` | `embed.small` |
| `provider` | `openai` / `openrouter` |
| `model` | `text-embedding-3-small` / `openrouter/openai/text-embedding-3-small` |
| `outcome` | `success` / `fallback` / `error` |
| `attempt` | 1..n |
| `latency_ms`, `tokens_in`, `error_code` | as observed |

The provider-health dashboard already aggregates this stream by provider/model.

---

## 7. Remaining Risks (not blockers for Phase 2 staging)

1. **`processing` orphan recovery** — if the worker dies mid-row, the row
   stays `processing` until manually requeued. Suggested follow-up: cron
   sweeper that flips `processing` rows older than 5m back to `failed`.
2. **No automated re-embed on dim change** — switching embedding model
   requires schema + bulk re-embed (out of scope).
3. **Health-check endpoint rate limit** (open from Phase 1.11) — still
   unrate-limited; admin-gated, low priority.
4. **Alert delivery** — warnings surface on the dashboard only. Email/Slack
   delivery is a future enhancement.

---

## 8. Constraint Compliance

| Constraint | Status |
| --- | --- |
| No vector dim change | ✅ Still `vector(1536)` |
| No re-embed of existing content | ✅ Not triggered |
| No RAG retrieval change | ✅ Untouched |
| No chat routing change | ✅ Untouched |
| No Vite preset change | ✅ Untouched |
| No deploy | ✅ Code only |
| No DNS change | ✅ Untouched |

---

## 9. Success Criteria — Verdict

| Criterion | Met |
| --- | --- |
| No data loss during provider outages | ✅ (10-attempt window + OpenRouter fallback + non-destructive failure path) |
| Failed items can be requeued | ✅ (single / batch / all-dead, audit-logged) |
| Queue health visible to admins | ✅ (new Embedding queue tab + alerts) |
| Recovery succeeds automatically after restoration | ✅ (`scheduled_for` lease filter) |
| Staging RAG ingestion can run safely at scale | ✅ subject to live load test in Phase 2.0 |

**Phase 1.13 verdict: ✅ GO** for Phase 2.0 Staging Readiness Review.

---

## 10. Files Touched

- `src/routes/api/public/cron/embeddings.ts` — MAX_ATTEMPTS 4→10, removed OpenAI hard-fail
- `src/lib/rag-observability.functions.ts` — added `listEmbeddingQueue`, `requeueEmbeddingItems`, `getEmbeddingAlerts`; audit-logged existing `requeueDeadLetters`
- `src/routes/_authenticated.dashboard.admin.provider-health.tsx` — tabbed UI + Embedding queue tab
- `docs/infrastructure/phase-1-13-embedding-hardening-report.md` — this report
