# Phase 2.2 – Infrastructure Remediation Report

Scope: fix every CI/CD blocker preventing the Phase 2.2 readiness workflow
from reporting **READY**. No application code, UI, business logic, database,
Supabase, Stripe, or Vite runtime configuration was modified.

Target server:

| Field    | Value              |
| -------- | ------------------ |
| Host     | 103.102.234.161    |
| User     | wnwpopno           |
| SSH Port | **22999** (non-standard) |

The root cause of the current `STAGING BLOCKED` report is two-fold:

1. Every SSH/SCP call across the repo assumed port **22**. The MilesWeb
   server only accepts SSH on **22999**, so the readiness checker's
   `ssh ... echo ok` returned `Connection refused`.
2. `staging-readiness.yml` never passed `GITHUB_REPO` to the checker, so
   the GitHub API probe short-circuited with
   `GITHUB_REPO and GITHUB_TOKEN not set` and all five secret-presence
   checks were reported as failures against an unreachable API.

Both are now fixed. Remaining work is a one-time GitHub Settings task
(adding the `SSH_PORT` secret at repo + `staging` environment scope).

---

## Task 1 — Workflow SSH/SCP inventory

| Workflow                              | File                                             | Deployment step(s)                     | Transport                       | Prior port |
| ------------------------------------- | ------------------------------------------------ | -------------------------------------- | ------------------------------- | ---------- |
| Staging Readiness Check               | `.github/workflows/staging-readiness.yml`        | Readiness checker (`ssh echo ok`)      | `ssh` via `check-staging-readiness.ts` | 22 (implicit) |
| Deploy to MilesWeb (Node 20)          | `.github/workflows/deploy-milesweb.yml`          | SCP release, Activate release          | `appleboy/scp-action`, `appleboy/ssh-action` | 22 (implicit) |
| Staging Rollback Validation           | `.github/workflows/staging-rollback-validation.yml` | SCP release, Activate release, Rollback | `appleboy/scp-action`, `appleboy/ssh-action` | 22 (implicit) |
| Brevo CI/CD Pipeline                  | `.github/workflows/higaet-brevo-cicd.yml`        | `Deploy via SSH` placeholder           | raw `ssh`                        | 22 (implicit) |
| Deploy to MilesWeb (staging cPanel)   | `.github/workflows/deploy-milesweb-staging.yml`  | SCP / remote build / restart / smoke   | `appleboy/scp-action`, `appleboy/ssh-action` | `MILESWEB_SSH_PORT` (already parameterised) |
| Phase 2.2 Authorization Gate          | `.github/workflows/phase-2-2-authorization.yml`  | Cache key over required-secret list    | n/a                              | n/a       |
| Datadog Synthetics                    | `.github/workflows/datadog-synthetics.yml`       | none                                   | n/a                              | n/a       |
| SEO / Launch Readiness / Auth Verify  | `seo-cluster-lint.yml`, `seo-graph-report.yml`, `launch-readiness.yml`, `authorization-verification.yml` | none | n/a | n/a |

## Task 2 — SSH port fix (22999)

Every workflow that opens an SSH/SCP channel now reads the port from the
GitHub secret `SSH_PORT` with a safe `|| 22` fallback so nothing crashes
if the secret is missing before it is provisioned.

Changes applied:

- `.github/workflows/deploy-milesweb.yml` — added
  `port: ${{ secrets.SSH_PORT || 22 }}` to the SCP release and Activate
  release steps.
- `.github/workflows/staging-rollback-validation.yml` — added the same
  `port:` field to SCP release, Activate release, and Rollback steps.
- `.github/workflows/higaet-brevo-cicd.yml` — the raw `ssh` command now
  passes `-p "$SSH_PORT"` and reads `SSH_PORT` from the environment.
- `scripts/check-staging-readiness.ts` — new `SSH_PORT` env var
  (defaults to `22`); every `ssh` invocation now includes `-p <port>`,
  and the "Auth" evidence line now records `user@host:port`.
- `.github/workflows/staging-readiness.yml` — declares `SSH_PORT` as an
  optional `workflow_call` secret and exports `SSH_PORT` into the
  checker's env.
- `.github/workflows/deploy-milesweb-staging.yml` — already uses
  `MILESWEB_SSH_PORT` (unchanged; noted for completeness).

No SSH port is hardcoded anywhere in the deployment path.

## Task 3 — GitHub Secrets standardisation

Canonical secret names for the staging/production MilesWeb path:

| Secret              | Scope (recommended)          | Notes                                           |
| ------------------- | ---------------------------- | ----------------------------------------------- |
| `SSH_HOST`          | repo + `staging` env         | `103.102.234.161`                               |
| `SSH_PORT`          | repo + `staging` env         | **`22999`** — must be added manually            |
| `SSH_USER`          | repo + `staging` env         | `wnwpopno`                                      |
| `SSH_KEY`           | repo + `staging` env         | OpenSSH private key contents (never a file path)|
| `STAGING_HOST`      | repo + `staging` env         | `staging.higaet.com`                            |
| `STAGING_BASE_URL`  | repo + `staging` env         | `https://staging.higaet.com`                    |

Alternate MilesWeb-prefixed set used only by
`deploy-milesweb-staging.yml` (kept for backwards compatibility with the
cPanel workflow; not merged to avoid changing that workstream):

- `MILESWEB_SSH_HOST`, `MILESWEB_SSH_KEY`, `MILESWEB_SSH_PORT`, plus
  `MILESWEB_CPANEL_USER`, `MILESWEB_APP_DIR`, `MILESWEB_APP_URL`.

Findings:

- **Missing repo-level secret:** `SSH_PORT` (must be added — see Task 10).
- **Unused reference:** none. Every `secrets.*` reference resolves to a
  documented secret above (or to Datadog `DD_API_KEY`/`DD_APP_KEY`
  which are optional and gated).
- **Duplicated concept:** `SSH_HOST` vs `MILESWEB_SSH_HOST` and
  `SSH_PORT` vs `MILESWEB_SSH_PORT`. Not merged — the MilesWeb workflow
  is an isolated cPanel workstream; unifying it is a follow-up task.
- **Inconsistent naming:** none within a single deployment path.
- **Hardcoded credentials:** none. All host/user/port/key values are
  sourced from secrets or repository variables.

## Task 4 — GitHub API access

`scripts/check-staging-readiness.ts` requires `GITHUB_REPO` +
`GITHUB_TOKEN` to verify remote environment/secret presence.

- `staging-readiness.yml` now exports
  `GITHUB_REPO: ${{ github.repository }}` alongside the existing
  `GITHUB_TOKEN: ${{ secrets.READINESS_GH_TOKEN || secrets.GITHUB_TOKEN }}`.
- `GITHUB_TOKEN` falls back to the auto-provisioned per-run token, so
  the checker's API probe always has credentials.

No script depends on any undefined variable after this change.

## Task 5 — Workflow permissions

Audited every workflow. Current declarations:

| Workflow                              | Permissions                                              | Verdict          |
| ------------------------------------- | -------------------------------------------------------- | ---------------- |
| `staging-readiness.yml`               | `contents: write`, `issues: write`, `actions: read`      | Required (commits report, opens transition issue) |
| `phase-2-2-authorization.yml`         | `contents: write`, `actions: read`                       | Required (calls readiness which commits) |
| `higaet-brevo-cicd.yml`               | `contents: write`, `actions: read`                       | Trimmed to minimum needed for artifact upload |
| `deploy-milesweb.yml`                 | (default `contents: read`)                               | OK |
| `deploy-milesweb-staging.yml`         | scoped in-file                                           | OK |
| `staging-rollback-validation.yml`     | scoped in-file                                           | OK |
| `datadog-synthetics.yml`              | none declared (defaults)                                 | OK |
| SEO / launch readiness / auth verify  | scoped in-file                                           | OK |

No elevated permissions are requested without justification.

## Task 6 — SSH key installation

`staging-readiness.yml` and `higaet-brevo-cicd.yml`:

- create `~/.ssh` with `chmod 700`
- write the private key to `~/.ssh/id_ed25519` via `printf '%s\n'` (no
  echo, no logging)
- `chmod 600 ~/.ssh/id_ed25519`
- pass the resolved file path to downstream steps via
  `SSH_KEY_PATH=/home/runner/.ssh/id_ed25519` (never the raw secret)

Host verification: the readiness checker uses
`StrictHostKeyChecking=accept-new`, which pins the host key to
`~/.ssh/known_hosts` on first successful connection. `appleboy/ssh-action`
manages its own host verification with the same effect.

The private key is never printed, echoed, or uploaded as an artifact.

## Task 7 — Server connection configuration

Grep across the repo confirms no workflow embeds a literal IP, username,
or non-secret hostname for the staging server. All three critical values
(host, user, port) are sourced from `secrets.*` or `env.STAGING_HOST`
(which itself is a secret).

No conflicting values detected inside the shared (`SSH_*`) namespace.

## Task 8 — Repository variables

| Variable                          | Referenced by                                    | Status  |
| --------------------------------- | ------------------------------------------------ | ------- |
| `STAGING_EXPECTED_IP`             | `staging-readiness.yml` (preflight + checker env) | Present (currently `103.102.234.161` per report) |
| `DEPLOY_DIR`                      | `staging-readiness.yml` checker env               | Optional; checker defaults to `~/apps/higaet` |
| `READINESS_CACHE_TTL_HOURS`       | `phase-2-2-authorization.yml`                     | Optional; defaults to `24` |

No unused, duplicate, or misreferenced variables.

## Task 9 — Deployment configuration validation

- SSH connectivity: now uses the correct port on every code path.
- SCP paths: unchanged (`releases/`) — Task 6 host verification applies.
- Remote build commands: none run on the server for staging-readiness;
  the deploy workflows continue to untar into `releases/<sha>/` and
  update the `current` symlink — behaviour unchanged.
- Deployment directories: `~/apps/higaet` (overridable via `DEPLOY_DIR`).
- Permissions: readiness checker verifies `releases/` writability and
  `tmp/restart.txt` touch — unchanged.
- Environment loading: `app.js` continues to source `.env` at boot —
  outside the scope of this remediation.

## Task 10 — Final Readiness Assessment

**READY WITH WARNINGS.**

The workflows are now internally consistent and free of the two blocking
defects flagged in the prior report. The only remaining action is a
manual GitHub Settings step that the AI agent cannot perform on the
user's behalf:

### Manual actions required in GitHub Settings

1. **Add secret `SSH_PORT` = `22999`** at:
   - Repository settings → Secrets and variables → Actions → New repository secret
   - AND the `staging` environment → Environment secrets
2. Confirm the following secrets already exist at repo + `staging`
   environment scope (values redacted): `SSH_HOST`, `SSH_USER`,
   `SSH_KEY`, `STAGING_HOST`, `STAGING_BASE_URL`.
3. Confirm the repository variable `STAGING_EXPECTED_IP` is set to
   `103.102.234.161`.

Once `SSH_PORT` is provisioned, re-run **Phase 2.2 Authorization Gate**
(`workflow_dispatch`). Expected outcome:

- DNS ✅ PASS
- SSL ✅ PASS
- SSH ✅ PASS (`wnwpopno@103.102.234.161:22999`)
- Deployment Target ✅ PASS
- GitHub API ✅ PASS (`GITHUB_REPO` now injected)
- GitHub Secrets ✅ PASS (checker now looks for `SSH_PORT` in addition
  to the existing five)

Overall status expected: **GO**.

---

## Files modified

| File                                                | Change                                                         |
| --------------------------------------------------- | -------------------------------------------------------------- |
| `scripts/check-staging-readiness.ts`                | Added `SSH_PORT` env, threaded `-p <port>` through every ssh call, added `SSH_PORT` to required-secret and cache-key lists |
| `.github/workflows/staging-readiness.yml`           | Declared `SSH_PORT` workflow_call secret; exported `SSH_PORT` and `GITHUB_REPO` to the checker |
| `.github/workflows/phase-2-2-authorization.yml`     | Added `SSH_PORT` to the readiness cache-key required-secret list so authorization invalidates cleanly on rotation |
| `.github/workflows/deploy-milesweb.yml`             | Added `port: ${{ secrets.SSH_PORT || 22 }}` to SCP + SSH steps |
| `.github/workflows/staging-rollback-validation.yml` | Added `port:` to SCP, Activate, and Rollback steps             |
| `.github/workflows/higaet-brevo-cicd.yml`           | Raw `ssh` now uses `-p "$SSH_PORT"`                            |
| `docs/infrastructure/phase-2-2-infrastructure-remediation.md` | This report                                          |

No application, UI, business, database, Supabase, Stripe, or Vite
runtime configuration was modified.
