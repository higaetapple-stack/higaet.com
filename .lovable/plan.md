# Quality Gates, Staging Pipeline & PR CI

Three coordinated changes to lock in release quality before production deploys.

## 1. `npm run test` as a unified quality gate

Update `package.json` scripts so a single `npm test` invocation runs the same gates CI and production builds enforce.

- `lint` — existing ESLint config (`eslint .`)
- `typecheck` — `tsgo --noEmit` (already validated cleanly today)
- `build` — `npm run build` (Vite + Nitro Cloudflare preset)
- `test:unit` — existing vitest suite (if present; otherwise skipped)
- `test` — runs `lint` → `typecheck` → `test:unit` → `build` sequentially, failing fast

Rationale: today `npm test` doesn't gate lint/typecheck/build together, so regressions can land silently.

## 2. Staging deployment pipeline (MilesWeb / VPS)

Add a `deploy-milesweb-staging` GitHub Actions workflow (companion to the existing `deploy-milesweb.yml` production one) that:

- Triggers on push to `staging` branch and on manual `workflow_dispatch`
- Runs the full quality gate (`npm ci` + `npm test`)
- Builds with `BUILD_TARGET=node` (already supported in `vite.config.ts`) to emit `.output/server/index.mjs` for Passenger/`app.js`
- Uploads `.output/` as an artifact
- Rsyncs `.output/`, `app.js`, `package.json`, and `public/` to the staging VPS via SSH
- Writes `/home/<user>/staging/.env` from GitHub Environment secrets (staging-scoped) before restarting Passenger
- Restarts the Node app via `touch tmp/restart.txt` (Passenger convention)
- Runs a smoke check against the staging URL

Required GitHub Environment (`staging`) secrets you'll add manually:
`MILESWEB_STAGING_HOST`, `MILESWEB_STAGING_USER`, `MILESWEB_STAGING_SSH_KEY`, `MILESWEB_STAGING_PATH`, `STAGING_URL`, plus the runtime env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, any others production uses).

Promotion flow: merge to `staging` → auto-deploy to staging VPS → validate → merge `staging` → `main` → existing production workflow deploys.

## 3. PR CI workflow

Add `.github/workflows/pr-checks.yml` that on every `pull_request` to `main` or `staging`:

- Checks out the PR
- Sets up Node 20 with npm cache
- Runs `npm ci`
- Runs `npm run build` (captures stdout+stderr to `build.log`)
- Runs `npm run lint` and `npm run typecheck` (captures logs)
- Always uploads `build.log`, `lint.log`, `typecheck.log` as workflow artifacts (retention: 14 days) — even on failure — so regressions are diagnosable from the PR page
- Posts a status check that blocks merge on failure (via branch protection, which you configure in GitHub Settings)

## Technical notes

- Node 20 pinned across workflows for parity with existing `deploy-milesweb.yml`.
- Staging workflow uses `webfactory/ssh-agent` + `rsync` (same pattern as your production deploy) to avoid introducing a new deploy mechanism.
- Build logs uploaded with `if: always()` so failed builds still produce artifacts.
- `npm test` runs sequentially, not in parallel, so the first failing gate short-circuits and the log is easy to read.
- No changes to `vite.config.ts`, Supabase integration files, or existing production deploy workflow.

## Files touched

- `package.json` — add/adjust `lint`, `typecheck`, `test:unit`, `test` scripts
- `.github/workflows/pr-checks.yml` — new
- `.github/workflows/deploy-milesweb-staging.yml` — new (or replace the existing stub if it's empty)

## Out of scope

- Configuring MilesWeb SSH access, DNS for staging subdomain, and GitHub branch-protection rules — these are account-level actions only you can do. I'll document the exact secrets/settings needed in the workflow file comments.
