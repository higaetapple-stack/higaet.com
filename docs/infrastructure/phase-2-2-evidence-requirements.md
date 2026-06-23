# Phase 2.2 — Evidence Requirements

Mandatory evidence to attach to `phase-2-2-prerequisite-report.md` before any deployment workflow is dispatched. Each row defines the **exact PASS criterion**; anything else is FAIL.

## Infrastructure Evidence

| Item | Evidence command | PASS criterion |
| --- | --- | --- |
| DNS resolution | `dig +short staging.higaet.com @1.1.1.1; dig +short staging.higaet.com @8.8.8.8` | Both queries return the same MilesWeb origin IP. |
| SSL validation | `openssl s_client -connect staging.higaet.com:443 -servername staging.higaet.com </dev/null \| openssl x509 -noout -subject -dates` | Subject `CN=staging.higaet.com`; `notAfter` ≥ today + 30 d. |
| SSH connectivity | `ssh -o BatchMode=yes -o ConnectTimeout=5 $SSH_USER@$SSH_HOST 'echo ok'` | Returns `ok` and exit 0. |
| Node runtime | `ssh ... 'node --version'` | Returns `v20.x` (any 20 minor). |

## GitHub Evidence

| Item | Evidence | PASS criterion |
| --- | --- | --- |
| Environment exists | Screenshot of Settings → Environments | Row `staging` present with protection rules. |
| Secrets exist | Screenshot of Settings → Environments → staging → Secrets | All five names listed: `STAGING_HOST`, `STAGING_BASE_URL`, `SSH_HOST`, `SSH_USER`, `SSH_KEY`. |
| Workflow visibility | GitHub Actions sidebar | `Staging Deploy + Rollback Validation (Phase 2.0.2)` and `Deploy to MilesWeb (Node 20)` both dispatchable from the UI. |

## Application Evidence

| Item | Evidence command | PASS criterion |
| --- | --- | --- |
| Build success | `bun run build` (CI log) | Exit 0; `.output/server/index.mjs` and `dist/` present. |
| Artifact creation | CI log of `Package release` step | `release-<sha>.tgz` written; size > 1 MB. |
| Smoke suite availability | `ls tests/smoke/*.smoke.spec.ts && bunx playwright test --list tests/smoke` | All six specs listed; no parse errors. |

## Overall Gate

Phase 2.2 deployment is **PASS** only when every row above is PASS with the evidence command's output attached. Any FAIL → halt and update `phase-2-2-prerequisite-report.md`.
