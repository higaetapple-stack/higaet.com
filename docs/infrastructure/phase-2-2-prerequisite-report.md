# Phase 2.2 — Prerequisite Report

**Mode:** Evidence-based prerequisite verification. No deployment performed.
**Carries forward:** `phase-2-1-staging-gate-report.md` (NO-GO, infrastructure blocked).

## Evidence Matrix

Each row requires **objective evidence**, not just existence. Where evidence cannot be produced from inside the application sandbox, the responsible owner and the exact verification command are recorded.

### Infrastructure

| Item | Status | Required evidence | Result |
| --- | --- | --- | --- |
| MilesWeb staging Node.js app | **FAIL** | cPanel screenshot of `~/apps/higaet` Node 20 app bound to `staging.higaet.com`. | Not provisioned. |
| `staging.higaet.com` DNS | **FAIL** | `dig +short staging.higaet.com @1.1.1.1` and `@8.8.8.8` both return the MilesWeb origin IP. | No `A` record. |
| SSL certificate | **FAIL** | `openssl s_client -connect staging.higaet.com:443 -servername staging.higaet.com </dev/null` returns Let's Encrypt cert with `CN=staging.higaet.com`, `notAfter` > 30 days. | No cert (depends on DNS). |
| Node runtime | **FAIL** | `ssh $SSH_USER@$SSH_HOST 'node --version'` returns `v20.x`. | Cannot verify — SSH not provisioned. |
| Process manager | **FAIL** | Passenger reachable via `tmp/restart.txt`, or `pm2 ls` returns app row. | Cannot verify. |
| Deployment dir writable | **FAIL** | `ssh ... 'test -w ~/apps/higaet/releases && echo ok'` returns `ok`. | Cannot verify. |

### Connectivity

| Item | Status | Required evidence | Result |
| --- | --- | --- | --- |
| SSH authentication | **FAIL** | `ssh -o BatchMode=yes $SSH_USER@$SSH_HOST 'echo ok'` returns `ok`. | Secret not provisioned. |
| Deploy user permissions | **FAIL** | `ssh ... 'touch ~/apps/higaet/tmp/restart.txt && echo ok'` returns `ok`. | Cannot verify. |
| GitHub Actions → staging env | **FAIL** | A dry-run job in `staging-rollback-validation.yml` reaches the `secrets` block without "Required input not provided". | Five secrets missing. |

### GitHub Configuration

| Item | Status | Required evidence | Result |
| --- | --- | --- | --- |
| `staging` environment exists | **UNVERIFIED** | Repo Settings → Environments lists `staging`. | Owner: ops. |
| `STAGING_HOST` | **FAIL** | Listed under staging environment secrets. | Missing. |
| `STAGING_BASE_URL` | **FAIL** | Same. | Missing. |
| `SSH_HOST` | **FAIL** | Same. | Missing. |
| `SSH_USER` | **FAIL** | Same. | Missing. |
| `SSH_KEY` | **FAIL** | Same; public half on `~/.ssh/authorized_keys` on MilesWeb. | Missing. |

### Isolation Validation

| Item | Status | Evidence | Result |
| --- | --- | --- | --- |
| No production DB modifications | **PASS** | Migrations folder unchanged in Phase 2.1; `phase-2-1-deployment-dry-run.md` confirms. | OK. |
| No production DNS operations | **PASS** | Workflows reference `STAGING_HOST` / `STAGING_BASE_URL` only; apex untouched. | OK. |
| No production deploy targets | **PASS** | `staging-rollback-validation.yml` targets `staging` environment only. | OK. |
| No production secret usage | **PASS** | Workflow secret list scoped to `staging` GitHub environment. | OK. |

## Decision

**STAGING DEPLOYMENT BLOCKED.** Eleven infrastructure and connectivity items remain FAIL/UNVERIFIED. Application-layer isolation checks are PASS.

Phase 2.2 execution (deployment, smoke, RAG, rollback reports below) cannot begin until every row above is PASS with attached evidence.

## Remediation (owner: ops)

1. Provision MilesWeb Node 20 app at `~/apps/higaet`, startup `app.js`, URL `staging.higaet.com`.
2. Add `A staging → <MilesWeb origin IP>` at the registrar (apex untouched).
3. Wait for propagation; enable AutoSSL for `staging.higaet.com`.
4. Create ed25519 deploy keypair; install public half on MilesWeb; add private half as `SSH_KEY` secret.
5. Add `STAGING_HOST`, `STAGING_BASE_URL`, `SSH_HOST`, `SSH_USER` to the GitHub `staging` environment.
6. Re-run this report; attach evidence command output per row.
