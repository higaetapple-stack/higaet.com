# Phase 2.2 — Application Smoke Report

**Status:** ⛔ NOT EXECUTED — blocked by `phase-2-2-prerequisite-report.md`.

Application-layer validation requires a live `STAGING_BASE_URL`. The Phase 2.0.1 suite (`tests/smoke/*.smoke.spec.ts`) is the source of truth and runs unchanged via:

```
SMOKE_BASE_URL=https://staging.higaet.com bun scripts/run-smoke-tests.ts
```

## Coverage Plan

| Area | Validation | Spec / Tool |
| --- | --- | --- |
| Authentication | login, logout, session persistence, protected routes | `tests/smoke/rbac.smoke.spec.ts` |
| RBAC | role enforcement, admin restrictions, unauthorized reject | `rbac.smoke.spec.ts` + `admin.smoke.spec.ts` |
| Storage | upload, retrieval, permissions | Manual checklist (no automated upload spec yet) |
| AI providers | OpenAI / Gemini / Groq / OpenRouter routing | `/dashboard/admin/provider-health` live check |
| Failover | force OpenAI 429, observe fallback + breaker open + recovery | `provider-health.functions.ts → forceProviderProbe` |

## Recording Contract

When executed, attach:

- `test-results/smoke/summary.json`
- Screenshot of `/dashboard/admin/provider-health` after a forced failover
- HAR or curl transcripts for any FAIL row

## Result

Pending deployment. No application validation performed in this phase.
