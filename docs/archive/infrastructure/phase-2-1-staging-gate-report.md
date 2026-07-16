# Phase 2.1 — Staging Gate Report

## Evaluation Matrix

| Area | Result | Source |
| --- | --- | --- |
| Infrastructure | **FAIL** | `phase-2-1-infrastructure-verification.md` — MilesWeb slot, DNS, SSH secrets not provisioned. |
| Deployment Pipeline | **PASS (static)** | `phase-2-1-deployment-dry-run.md` — workflows author-correct; live run gated on infra. |
| AI Providers | **PASS** | Phase 1.10/1.11 — Gemini, Groq, OpenRouter active; OpenAI billing known issue with auto-fallback. |
| Embedding & RAG | **PASS** | Phase 1.12/1.13 — OpenRouter embedding fallback live; queue management + alerts in admin dashboard. |
| Health Protections | **PASS** | `phase-2-1-health-protection-report.md` — staging-gated limiter wired into `/api/public/health`. |
| Smoke Suite | **PASS** | Phase 2.0.1 — `tests/smoke/*.smoke.spec.ts` + `scripts/run-smoke-tests.ts`. |
| Recovery Readiness | **PASS** | `staging-recovery-playbook.md` covers deploy / DNS / provider / embedding / Supabase / emergency. |

## Final Decision

**NO-GO for live Phase 2.1 staging deployment.**

All application-layer prerequisites are satisfied. The single blocker is infrastructure provisioning — once that lands, this report flips to **GO** without code changes.

## Blocking Issues

1. MilesWeb staging Node.js application not provisioned.
2. `staging.higaet.com` DNS `A` record missing.
3. SSL/TLS not yet issued (depends on #2).
4. GitHub `staging` environment secrets missing: `STAGING_HOST`, `STAGING_BASE_URL`, `SSH_HOST`, `SSH_USER`, `SSH_KEY`.

## Remediation Actions (owner: infra / ops)

1. Create the MilesWeb Node.js application at `~/apps/higaet` (Node 20, startup `app.js`).
2. Add the `A staging → <MilesWeb origin IP>` DNS record. Leave the apex record untouched.
3. Enable AutoSSL for `staging.higaet.com` after DNS propagates.
4. Add the five GitHub secrets to the `staging` environment.
5. Add staging env vars on MilesWeb: `HIGAET_STAGE=staging`, `HEALTH_RL_LIMIT=60`, `HEALTH_RL_WINDOW_MS=60000`, plus the Supabase + provider keys.
6. Re-run this gate report and confirm Infrastructure = PASS; result becomes **GO**.

## Exit Criteria Status

| Criterion | Met? |
| --- | --- |
| Staging infrastructure verified | ❌ (blocked) |
| Deployment pipeline validates | ✅ static |
| Health protections implemented | ✅ |
| Soak runner extended (design) | ✅ design only; live run after deploy |
| Recovery playbook exists | ✅ |
| Staging gate report returns GO | ❌ pending #1–#4 |

Phase 2.2 (production readiness review) remains gated on a clean Phase 2.1 GO + a successful 24–48 h staging soak.
