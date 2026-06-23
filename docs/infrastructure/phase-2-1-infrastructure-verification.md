# Phase 2.1 — Infrastructure Verification

**Mode:** Pre-deployment audit. No infrastructure was modified.

## Infrastructure Verification

| Component              | Status | Notes |
| ---------------------- | ------ | ----- |
| `STAGING_HOST`         | FAIL   | Referenced in `.github/workflows/staging-rollback-validation.yml`; not provisioned in GitHub repo/environment secrets yet. |
| `STAGING_BASE_URL`     | FAIL   | Same workflow; missing. Required value example: `https://staging.higaet.com`. |
| `SSH_HOST`             | FAIL   | Referenced in `deploy-milesweb.yml`; not provisioned. |
| `SSH_USER`             | FAIL   | Referenced in both workflows; not provisioned. |
| `SSH_KEY`              | FAIL   | Referenced in both workflows; not provisioned. MilesWeb deploy key must be issued separately for staging. |
| MilesWeb Application   | FAIL   | No Node.js application slot has been provisioned for `staging.higaet.com` on MilesWeb. |
| `staging.higaet.com` DNS | FAIL | No `A` record observed. Awaiting MilesWeb origin IP from the staging app provisioning step. |
| SSL/TLS                | FAIL   | Cannot be issued until DNS resolves to MilesWeb. AutoSSL via cPanel is the assumed path. |

## Result

**STATUS: STAGING BLOCKED**

Phase 2.1 deployment activity (Tasks B–F live execution) cannot begin until the items above are resolved.

## Remediation Steps

1. **MilesWeb provisioning** — Create a Node.js application via cPanel → Setup Node.js App:
   - Application root: `~/apps/higaet`
   - Application URL: `staging.higaet.com`
   - Node version: 20.x
   - Startup file: `app.js`
2. **DNS** — Add `A staging → <MilesWeb origin IP>` at the registrar managing `higaet.com`. Do **not** touch the apex `A` record (production).
3. **SSL** — After DNS resolves, enable AutoSSL for `staging.higaet.com` in cPanel; verify Let's Encrypt issuance.
4. **GitHub secrets** — In the `staging` GitHub Environment, add: `STAGING_HOST`, `STAGING_BASE_URL`, `SSH_HOST`, `SSH_USER`, `SSH_KEY` (ed25519 private key whose public half is in `~/.ssh/authorized_keys` on MilesWeb).
5. **Re-run this verification** and update the table to PASS before proceeding to Task B execution.

## Out of Scope (per Phase 2.1 constraints)

- Production DNS, production deploy, Vite preset changes, DB migrations, Supabase Auth/Storage config, provider routing changes.
