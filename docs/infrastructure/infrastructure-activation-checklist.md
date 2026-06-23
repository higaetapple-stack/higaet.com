# Infrastructure Activation Checklist

Step-by-step verification procedures for provisioning the HIGAET staging environment. Run top to bottom; each step lists the exact command and the expected output.

## A. MilesWeb

| # | Action | Verification |
| --- | --- | --- |
| 1 | cPanel → Setup Node.js App → Create Application. Root: `~/apps/higaet`. URL: `staging.higaet.com`. Node 20.x. Startup: `app.js`. | App appears in "Node.js Apps" list with status **Running**. |
| 2 | Runtime check | `ssh $SSH_USER@$SSH_HOST 'source ~/nodevenv/apps/higaet/20/bin/activate && node --version'` → `v20.x.x`. |
| 3 | Startup command | App's "Startup File" field reads `app.js`; `cat ~/apps/higaet/app.js` is non-empty. |
| 4 | Deployment directory | `ssh ... 'mkdir -p ~/apps/higaet/releases ~/apps/higaet/tmp && test -w ~/apps/higaet/releases && echo ok'` → `ok`. |
| 5 | Process manager (Passenger) | `ssh ... 'touch ~/apps/higaet/tmp/restart.txt && echo ok'` → `ok`; subsequent health probe returns 200 within 30 s. |

## B. DNS

| # | Action | Verification |
| --- | --- | --- |
| 1 | Registrar → add `A staging → <MilesWeb origin IP>`. Apex untouched. | Record visible in registrar UI. |
| 2 | Propagation | `dig +short staging.higaet.com @1.1.1.1` and `@8.8.8.8` both return the origin IP. Allow up to 30 min. |
| 3 | Troubleshooting | If wrong IP: check for conflicting CNAME, stale cache (`dig +trace`), or CDN proxy mode at registrar. |

## C. SSL

| # | Action | Verification |
| --- | --- | --- |
| 1 | cPanel → SSL/TLS Status → run AutoSSL for `staging.higaet.com`. | Status row turns green within 10 min. |
| 2 | Hostname validation | `openssl s_client -connect staging.higaet.com:443 -servername staging.higaet.com </dev/null 2>/dev/null \| openssl x509 -noout -subject -dates` → subject contains `CN=staging.higaet.com`, `notAfter` ≥ 30 days out. |
| 3 | Renewal | AutoSSL runs daily; confirm "Auto-renew" is enabled. Set a calendar reminder 7 days before `notAfter`. |

## D. GitHub

| # | Action | Verification |
| --- | --- | --- |
| 1 | Repo → Settings → Environments → New: `staging`. | Environment listed. |
| 2 | Protection rules: required reviewer for deploys; restrict to `main` branch. | Visible in environment settings. |
| 3 | Add secrets to the `staging` environment: `STAGING_HOST`, `STAGING_BASE_URL`, `SSH_HOST`, `SSH_USER`, `SSH_KEY` (ed25519 private key, full PEM block). | All five rows present; values masked. |
| 4 | Validate visibility | `staging-rollback-validation.yml` dry-dispatch reaches `Activate release` step without "Required input not provided" error. |

## Sign-off

Once every row above is green, mark the gate row "Infrastructure" in `phase-2-2-prerequisite-report.md` as **PASS** with attached command output, then proceed to `phase-2-2-execution-runbook.md`.
