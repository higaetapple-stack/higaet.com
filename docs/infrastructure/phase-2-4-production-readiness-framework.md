# Phase 2.4 — Production Readiness Framework

Approval gates and objective PASS criteria for authorizing the Phase 3.0 production cutover. Audit framework only — no production action is taken in Phase 2.4.

## Approval Gates

| # | Gate | Owner | Objective PASS criterion |
| --- | --- | --- | --- |
| 1 | Infrastructure | Ops | Production MilesWeb slot provisioned with the same Node 20 + Passenger layout proven in staging. Apex DNS plan documented. SSL pre-issued or AutoSSL pre-configured. Rollback symlink layout identical to staging. |
| 2 | Deployment | Eng + Ops | `deploy-milesweb.yml` with `environment=production` executes a dry-run against a parallel app slot without errors. Production secrets present in GitHub `production` environment. Concurrency group prevents overlapping deploys. |
| 3 | Security | Eng | Latest `security--run_security_scan` clean (no HIGH). RLS verified on every public table. No `service_role` key referenced from client bundles. Production rate limits enabled on `/api/public/*` per Phase 2.1 pattern. |
| 4 | Smoke Testing | Eng | `scripts/run-smoke-tests.ts` against production-equivalent URL exits 0 with `unexpected: 0`. |
| 5 | AI Providers | Eng | Provider-health dashboard shows all four providers within SLO; OpenAI billing restored OR documented permanent reliance on fallbacks with capacity headroom. |
| 6 | Embeddings | Eng | `ai_embeddings_queue` backlog steady-state ≤ 1 h of ingestion. Dead-letter requeue path rehearsed. 1536-dim invariant enforced. |
| 7 | RAG | Eng | Seed-query accuracy ≥ 4/5 maintained for 7 days; p95 retrieval ≤ 1.5 s. |
| 8 | Rollback | Ops | Live rollback rehearsed in staging within last 7 days. Recovery time ≤ 60 s. Symlink-based restore documented in `staging-recovery-playbook.md` mirrored for production. |
| 9 | Soak Testing | Eng | Phase 2.3 soak returns PASS or CONDITIONAL PASS with all remediations cleared. |

## Decision Rule

**GO for Phase 3.0 production cutover** only when all nine gates are PASS with evidence dated within the last 14 days.

Any FAIL → NO-GO with remediation and a re-evaluation date.

## Out of Scope (Phase 2.4)

- Cutover scheduling (Phase 3.0).
- DNS apex change (Phase 3.0).
- Cron rewiring to production URLs (Phase 3.0).
- Customer comms (Phase 3.0).
