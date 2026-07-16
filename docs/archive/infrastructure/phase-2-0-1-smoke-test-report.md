# Phase 2.0.1 — Automated Staging Smoke Test Suite

**Status:** ✅ Implemented (validation infrastructure only — no deployment performed)
**Scope:** Repeatable validation suite that runs against any HIGAET environment.
**Out of scope:** Production deployment, DNS, runtime cutover, corpus re-embedding.

---

## Deliverables

| Artifact | Purpose |
| --- | --- |
| `tests/smoke/health.smoke.spec.ts` | `/healthz`, `/api/public/health`, security headers |
| `tests/smoke/rbac.smoke.spec.ts` | Auth + RBAC cycle (existing, pre-Phase 2.0.1) |
| `tests/smoke/ai-routing.smoke.spec.ts` | Chat endpoint surface + rate-limit envelope |
| `tests/smoke/embeddings.smoke.spec.ts` | Cron embeddings endpoint auth surface |
| `tests/smoke/rag.smoke.spec.ts` | Public surface availability |
| `tests/smoke/admin.smoke.spec.ts` | Admin dashboard auth gate |
| `scripts/run-smoke-tests.ts` | Single-command runner; JSON summary at `test-results/smoke/summary.json` |

---

## Coverage Matrix

| Subsystem | Spec | Type |
| --- | --- | --- |
| Infrastructure / health | `health.smoke.spec.ts` | Black-box HTTP |
| Authentication + RBAC | `rbac.smoke.spec.ts` | Browser flow (Playwright) |
| AI routing | `ai-routing.smoke.spec.ts` | Black-box HTTP envelope |
| Embedding cron | `embeddings.smoke.spec.ts` | Black-box HTTP envelope |
| RAG surface | `rag.smoke.spec.ts` | Black-box HTTP |
| Admin dashboards | `admin.smoke.spec.ts` | Browser gate check |

The chat / cron / admin specs intentionally validate the **auth + rate-limit
envelope** rather than executing real model calls, so the suite is safe to run
against staging or production without consuming provider budget. Deeper
behaviour (provider fallback, embedding dimensions, RAG citation quality) is
covered by the existing `provider-health` and `rag-observability` server
functions and the admin dashboard, which the suite reaches via `admin.smoke`.

---

## Runner Contract

```
SMOKE_BASE_URL=https://staging.higaet.com bun scripts/run-smoke-tests.ts
```

- Exit 0 → all suites passed
- Exit 1 → one or more suites failed
- Exit 2 → runner itself errored

Machine-readable summary written to `test-results/smoke/summary.json`:

```json
{
  "target": "...",
  "elapsedMs": 0,
  "exitCode": 0,
  "expected": 0,
  "unexpected": 0,
  "ok": true
}
```

This file is consumed by the Phase 2.0.2 rollback pipeline.

---

## Remaining Risks (carry into Phase 2.1)

- Provider deep-checks rely on the admin dashboard, not the smoke runner.
- OpenAI 429 still affects staging cost profile.
- Cron URLs in `pg_cron` still hardcoded to production (Phase 2.0 finding).
