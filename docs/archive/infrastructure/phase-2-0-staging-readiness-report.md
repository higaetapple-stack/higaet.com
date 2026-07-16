# Phase 2.0 — Staging Deployment Readiness Certification

**Date:** 2026-06-23
**Scope:** Audit-only. No infrastructure, DNS, runtime, or schema changes performed.
**Objective:** Determine whether HIGAET can safely proceed to Phase 2.1 (MilesWeb staging runtime deployment).

---

## 1. Infrastructure Readiness

| Area | Status | Evidence / Notes |
| --- | --- | --- |
| MilesWeb account & SSH target | 🟡 Partial | `.github/workflows/deploy-milesweb.yml` scaffolded; host/user/key secrets not yet validated end-to-end on staging slot. |
| Node runtime (v20+) on host | 🟡 Unverified | Required by TanStack Start build output; needs `node -v` smoke from MilesWeb shell before cutover. |
| Passenger compatibility | 🟡 Partial | `app.js` entrypoint exists; Passenger `startup_file` + `nodejs_version` directives must be confirmed in MilesWeb cPanel. |
| CI/CD pipeline | ✅ Ready | `deploy-milesweb.yml` (build + rsync + restart) and `datadog-synthetics.yml` (post-deploy probes) present. |
| Environment variable completeness | 🟡 Partial | `.env.example` covers Supabase + AI providers; MilesWeb staging environment must mirror `SUPABASE_*`, `LOVABLE_API_KEY`, `OPENROUTER_API_KEY`, `GROQ_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, `OPENAI_API_KEY` (degraded OK), session/encryption secrets. |
| Rollback capability | 🟡 Partial | rsync deploy supports atomic symlink swap; documented in `docs/runbooks/domain-cutover.md` but not yet rehearsed on MilesWeb. |

---

## 2. Application Readiness

| Capability | Status | Notes |
| --- | --- | --- |
| Authentication (Supabase + Google OAuth) | ✅ Ready | `_authenticated` gate active; `requireSupabaseAuth` + `attachSupabaseAuth` wired in `src/start.ts`. |
| RBAC (`has_role` SECURITY DEFINER) | ✅ Ready | Admin routes (`/dashboard/admin/*`) gated; verified in Phase 1.13. |
| Storage (Supabase buckets) | 🟡 Partial | Bucket policies present; needs staging smoke for upload/download with RLS. |
| Payments | 🟡 Partial | Stripe/Paddle integrations scaffolded — staging webhook URLs must be registered before live test charge. |
| AI providers | ✅ Ready | Multi-provider chain (OpenAI degraded → Gemini/Groq/OpenRouter fallback), circuit breaker, telemetry — Phase 1.10–1.12. |
| RAG retrieval | ✅ Ready | Embedding fallback (Phase 1.12) + queue hardening (Phase 1.13). Dimension guard at 1536. |
| Cron jobs | ✅ Ready | `/api/public/cron/embeddings` with `MAX_ATTEMPTS=10`, OpenRouter-capable. pg_cron entries to be re-pointed at staging host URL. |
| Health endpoints | ✅ Ready | Provider health + embedding queue dashboards live under `/dashboard/admin/provider-health`. |

---

## 3. Operational Readiness

| Area | Status | Notes |
| --- | --- | --- |
| Monitoring | ✅ Ready | Datadog synthetics workflow present; provider/embedding dashboards live. |
| Logging | ✅ Ready | `ai_usage`, `audit_logs` tables; structured logs via `lovable-error-reporting`. |
| Audit trails | ✅ Ready | Requeue + admin actions logged (Phase 1.13). |
| Rollback procedures | 🟡 Partial | `docs/runbooks/domain-cutover.md` exists; MilesWeb-specific rehearsal pending. |
| Incident runbooks | ✅ Ready | `docs/runbooks/{incident-response,rag-worker-failure,webhook-failure,security-incident,database-restore,payment-failure}.md`. |

---

## 4. Deployment Risks

### 🔴 Critical
- None blocking staging. (Production cutover remains gated on items below.)

### 🟠 High
- **OpenAI billing still 429.** Chat + embeddings survive via fallback, but cost/performance profile in staging will reflect OpenRouter/Gemini routing. Restore before production load test.
- **MilesWeb Passenger config unverified.** First deploy may fail on Node version mismatch or missing `startup_file`. Requires a dry-run before Phase 2.1.

### 🟡 Medium
- **Health-check endpoint not rate-limited** (carried from Phase 1.11). Public-ish surface; add IP throttle before opening staging URL externally.
- **Cron URLs hardcoded to production host in pg_cron.** Must duplicate jobs against the staging stable URL (`project--{id}-dev.lovable.app` or MilesWeb staging hostname) without disabling prod.
- **Rollback rehearsal missing.** Symlink-swap rollback documented but not executed on MilesWeb.

### 🟢 Low
- Embedding dead-letter recovery is manual via admin UI (acceptable for staging).
- Datadog synthetics cover surface paths only; deep RAG path not yet scripted.

---

## 5. Final Decision

### 🟡 GO WITH RISKS — Phase 2.1 (Staging Runtime Deployment) authorized.

**Conditions for proceeding:**
1. Provision MilesWeb staging slot with Node 20+ and confirm Passenger `startup_file = app.js`.
2. Mirror all required env vars into the staging environment (see §1).
3. Register staging webhook URLs (Stripe/Paddle) and a parallel pg_cron entry pointed at the staging host.
4. Rehearse rsync symlink-swap rollback once before opening the staging URL to stakeholders.
5. Keep production DNS, Vite preset, and corpus re-embedding **out of scope** for Phase 2.1.

**Conditions blocking production cutover (Phase 2.2+):**
- Restore OpenAI billing OR sign off on permanent OpenRouter/Gemini routing with cost model.
- Complete a full staging soak (auth, RBAC, payments, RAG ingest+query, cron, rollback).
- Rate-limit the public health endpoint.

---

## Appendix — Phase Lineage

| Phase | Outcome |
| --- | --- |
| 1.10 Provider Activation | ✅ |
| 1.11 RAG Readiness Audit | ✅ (identified SPOF) |
| 1.12 RAG Resilience | ✅ (OpenRouter embedding fallback) |
| 1.13 Embedding Hardening | ✅ (queue + retries + admin UI) |
| **2.0 Staging Readiness** | **🟡 GO WITH RISKS** |
| 2.1 Staging Runtime Deployment | ⏳ Authorized, not started |
| 2.2 Production Cutover | 🚫 Blocked pending §5 conditions |
