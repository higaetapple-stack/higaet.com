
# HIGAET MilesWeb Deployment Audit (Read-Only)

No files were modified. Findings below are based on the repo state and the verified server snapshot you provided.

---

## A. Current Deployment Architecture (as it exists on the server today)

```text
Developer → (nothing) → MilesWeb cPanel
                          └─ Passenger boots /home/wnwpopno/higaet-staging/app.js
                             └─ cPanel sample "It works!" http.createServer
```

Server reality (verified):
- `app.js` is the **cPanel auto-generated stub** (`http.createServer → "It works!"`), NOT the repo's `app.js`.
- No `package.json`, no `.output/`, no `node_modules`, no `.git`, no `releases/`, no `shared/`.
- `server.js` and `public/` are also cPanel scaffolding artifacts.
- `stderr.log` exists but is empty → Passenger has never crashed because the stub boots cleanly.

**Conclusion: no GitHub Actions deployment has ever successfully written into `/home/wnwpopno/higaet-staging/`.** Passenger is serving exactly what cPanel created when the Node.js App was first provisioned.

Confidence: **High** (matches every symptom: empty stderr, missing `releases/`, stub `app.js`).

---

## B. Expected Deployment Architecture (per repo)

```text
Developer
  │ git push origin staging   (or manual dispatch)
  ▼
GitHub
  │
  ▼
GitHub Actions: .github/workflows/deploy-milesweb-staging.yml
  ├─ Preflight (secrets/vars check)
  ├─ bun install --frozen-lockfile
  ├─ BUILD_TARGET=node bun run build:node         → emits .output/server/index.mjs
  ├─ Verify .output/server/index.mjs exists locally
  ├─ Build prod package.json (strip devDeps)
  ├─ tar -czf release.tar.gz {app.js, package.json, .output, dist?}
  ├─ scp release.tar.gz  →  /home/wnwpopno/deploy-staging/
  ├─ ssh: verify tarball contains .output/server/index.mjs
  ├─ ssh: extract to /home/wnwpopno/higaet-staging/releases/<STAMP>/
  │        └─ npm install --omit=dev   (inside that release)
  │        └─ ln -sf shared/.env  release/.env
  │        └─ atomic symlink swap into APP_ROOT:
  │              app.js, package.json, .output, dist, node_modules
  │        └─ touch APP_ROOT/tmp/restart.txt   (Passenger reload)
  ├─ ssh: reality check (file listing, node --check, curl health)
  └─ Smoke test:  GET https://staging.higaet.com/api/public/health  → 200
```

End state expected in `/home/wnwpopno/higaet-staging/`:
```text
releases/<STAMP>/{app.js, package.json, .output/, node_modules/, .env→shared/.env}
shared/.env
app.js          → releases/<STAMP>/app.js          (symlink)
package.json    → releases/<STAMP>/package.json    (symlink)
.output         → releases/<STAMP>/.output         (symlink)
node_modules    → releases/<STAMP>/node_modules    (symlink)
tmp/restart.txt
```

The repo is internally consistent: `app.js` (repo version) imports `.output/server/index.mjs`; `vite.config.ts` emits the `node-server` Nitro preset when `BUILD_TARGET=node`; the workflow gates every transit point with a fail-closed check.

Confidence: **High**.

---

## C. Root Cause Analysis — why the server is still the stub

There is one dominant root cause with three contributing factors. Ranked by likelihood:

### RC-1 (PRIMARY): The deployment workflow has never completed successfully — most likely never run on `staging`.

Evidence:
- `releases/` does not exist on the server. The activation step **creates** `releases/` and writes `releases/<STAMP>/` on every successful run, so its absence proves zero successful runs.
- `/home/wnwpopno/deploy-staging/` also does not exist (per your earlier audit). The SCP step targets `/home/wnwpopno/deploy-staging/`. If even one SCP had landed, the directory would exist (scp auto-creates parents when target ends in `/`, but `appleboy/scp-action` does **not** create the target directory — it fails if it is missing).
- `stderr.log` is empty → Passenger never even tried to boot the repo's `app.js` (which logs `[passenger] booting HIGAET node server` on every import).
- The workflow triggers are `workflow_dispatch` and `push: [staging]`. If the connected branch is `main` and nobody dispatched it manually, **nothing has ever fired**.

Confidence: **Very High**.

### RC-2 (CONTRIBUTING): Server-side prerequisites missing — workflow would fail on first run anyway.

The workflow assumes these exist:
- `/home/wnwpopno/deploy-staging/`  → **MISSING**. `appleboy/scp-action` will fail uploading to a non-existent target directory. CI step "Upload release to MilesWeb" would be the first red step.
- `/home/wnwpopno/higaet-staging/shared/.env` → **MISSING**. Not fatal to deploy (the symlink step is conditional: `if [ -f "$SHARED_DIR/.env" ]`), but the running app would boot without `SUPABASE_*` / `BREVO_API_KEY` and fail health checks → final smoke test fails → rollback signal.
- cPanel "Setup Node.js App" must point Application Root to `/home/wnwpopno/higaet-staging` and Startup File to `app.js` — this part appears correct based on your verified findings, but Passenger is currently locked onto the **stub** `app.js`. A successful symlink swap + restart.txt will replace it; until then, Passenger keeps serving the stub.

Confidence: **High**.

### RC-3 (CONTRIBUTING): GitHub Secrets for the `staging` environment not configured.

Workflow's preflight requires:
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`
- `MILESWEB_SSH_HOST`, `MILESWEB_SSH_KEY`
- Optional `MILESWEB_SSH_PORT` (must be `22999` for this server)

If any are missing, the Preflight step fails before build → no artifact → no upload → server stays empty. This is consistent with the observed state.

Confidence: **High**.

---

## D. Deployment Risks (latent — will bite the first successful run)

| # | Risk | Severity | Notes |
|---|---|---|---|
| D-1 | `appleboy/scp-action` does not create `/home/wnwpopno/deploy-staging/`. First run fails at SCP. | Critical | Manual `mkdir -p /home/wnwpopno/deploy-staging` required once. |
| D-2 | `shared/.env` missing → runtime config (`SUPABASE_URL`, `BREVO_API_KEY`) absent. | Critical | App boots but smoke test fails. |
| D-3 | Default `MILESWEB_SSH_PORT` in workflow is `22` (fallback). MilesWeb uses `22999`. If secret unset, SSH dies with timeout/refusal. | Critical | Secret MUST be set. |
| D-4 | `bun.lockb`/`package-lock.json` packaging is conditional; if `npm install --omit=dev` inside the release runs without a lockfile, it resolves to floating versions. | Medium | Reproducibility risk; not a launch blocker. |
| D-5 | Symlink swap replaces `app.js` only on success. If activation fails mid-step, server is left with stub `app.js` (current state) or a half-broken symlink. | Medium | Atomic-ish, but no rollback to previous release. |
| D-6 | The presence of cPanel's `server.js` and `public/` (not symlinked) sits alongside the symlinked `app.js`. Passenger ignores them (Startup File = `app.js`), so harmless but noisy. | Low | |
| D-7 | Two parallel workflows exist: `deploy-milesweb.yml` (older, targets `~/apps/higaet/`, uses `SSH_*` secrets, `bun run build` for Cloudflare preset) and `deploy-milesweb-staging.yml` (current, correct). Running the wrong one would deploy to the wrong path with the wrong build. | High | See §F. |

---

## E. Missing Files / Prerequisites

### On the server (`/home/wnwpopno/`)
- `deploy-staging/` directory — **missing, required by SCP step.**
- `higaet-staging/shared/.env` — **missing, required by runtime.**
- `higaet-staging/releases/` — will be created by first successful run, not required pre-deploy.

### In the repo
Nothing missing. `app.js`, `vite.config.ts`, `package.json` script `build:node`, and `.github/workflows/deploy-milesweb-staging.yml` are all present and internally consistent.

### Required runtime environment variables (server `.env`)
Required for boot + health:
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_URL` (mirrored for SSR)
- `VITE_SUPABASE_PUBLISHABLE_KEY` (mirrored for SSR)
- `BREVO_API_KEY` (transactional email)
- `NODE_ENV=production` (set by `app.js` if absent)
- `PORT` — injected by Passenger; do **not** hardcode

Recommended:
- `SUPABASE_SERVICE_ROLE_KEY` (server-only admin paths)
- `SESSION_SECRET`

### Required GitHub Secrets (Environment: `staging`)
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`
- `MILESWEB_SSH_HOST`, `MILESWEB_SSH_KEY`, `MILESWEB_SSH_PORT=22999`

---

## F. Incorrect / Suspect Workflow Steps

| Workflow | Step | Issue |
|---|---|---|
| `deploy-milesweb.yml` (legacy) | `Build` runs `bun run build` (no `BUILD_TARGET=node`) | Emits **Cloudflare** preset (`dist/`), not Node bundle. `Boot probe` would still attempt to import `.output/server/index.mjs` — likely fails. Targets `~/apps/higaet/`, not `~/higaet-staging/`. **Should not be used.** |
| `deploy-milesweb.yml` | SCP `target: "releases/"` | Relative path = `~/releases/`, not the configured APP_ROOT. Wrong destination. |
| `deploy-milesweb-staging.yml` | `Upload release to MilesWeb` → `target: /home/wnwpopno/deploy-staging/` | Directory must pre-exist on server. Action does not create it. |
| `deploy-milesweb-staging.yml` | Activation symlinks `package.json` and `app.js` from release into APP_ROOT | Replaces cPanel stub `app.js` on first success — correct, but requires a successful run to reach this step. |
| `deploy-milesweb-staging.yml` | No `appleboy/ssh-action` step to `mkdir -p /home/wnwpopno/deploy-staging` before SCP | First-run bootstrap gap. |

Confidence: **High**.

---

## G. Exact Workflow Changes Required (described, not applied)

In priority order:

1. **Manual server bootstrap (one-time, outside CI):**
   - `mkdir -p /home/wnwpopno/deploy-staging`
   - `mkdir -p /home/wnwpopno/higaet-staging/shared`
   - Create `/home/wnwpopno/higaet-staging/shared/.env` with the runtime vars in §E.

2. **GitHub Secrets (Environment: `staging`):**
   - Add the 6 secrets in §E, including `MILESWEB_SSH_PORT=22999`.

3. **Workflow edits (when you exit plan mode):**
   - In `deploy-milesweb-staging.yml`, add an `ssh-action` step **before** the SCP step that runs `mkdir -p /home/wnwpopno/deploy-staging /home/wnwpopno/higaet-staging/{releases,shared,tmp}`. This makes the pipeline self-bootstrapping.
   - Add a hard preflight that fails if `shared/.env` is missing (currently it's silently optional via `if [ -f ... ]`).
   - **Delete or disable** `.github/workflows/deploy-milesweb.yml` to prevent accidental dispatch of the legacy Cloudflare-target workflow against MilesWeb.
   - Confirm the connected GitHub repo has a `staging` branch (the workflow only auto-triggers on `push: [staging]`).

4. **Trigger:**
   - `git push origin staging`, or in GitHub → Actions → "Deploy MilesWeb Staging" → Run workflow.

5. **First successful run will replace the stub:**
   - `app.js` symlink → `releases/<STAMP>/app.js` (the repo's Passenger shim with diagnostics)
   - `.output/server/index.mjs` becomes resolvable
   - `tmp/restart.txt` touched → Passenger reloads → HIGAET serves on `https://staging.higaet.com`.

---

## H. Compatibility Verification

| Layer | Required | Status | Confidence |
|---|---|---|---|
| MilesWeb cPanel | Application Root `/home/wnwpopno/higaet-staging`, Startup File `app.js`, Node 20.x | Configured (per your snapshot) | High |
| Phusion Passenger | Reads `tmp/restart.txt` for reload; respects `process.env.PORT` | Repo's `app.js` complies (does **not** call `http.createServer`; delegates to Nitro which honors `PORT`) | High |
| Node.js 20.20.2 | Compatible with Nitro `node-server` preset and Bun-produced output | Yes | High |
| Vite/Nitro build | `BUILD_TARGET=node` produces `.output/server/index.mjs` | Confirmed in `vite.config.ts` | High |
| Bun in CI | Used for install + build; produces Node-compatible bundle | Yes | High |

No compatibility blockers between the repo and MilesWeb/Passenger/Node 20. The blocker is operational, not technical.

---

## Final Verdict

The HIGAET application code, build configuration, Passenger shim, and CI workflow are correctly wired end-to-end. The reason `/home/wnwpopno/higaet-staging/` still contains only cPanel's `app.js`, `server.js`, and `public/` is:

> **No successful GitHub Actions run has ever delivered a release to this server.** This is most likely because (a) the workflow has never been triggered on the `staging` branch / via dispatch, and/or (b) the required GitHub Secrets are not set, and/or (c) the SCP target directory `/home/wnwpopno/deploy-staging/` does not exist on the server — which would fail the first run before any files are written.

Until a workflow run reaches the "Activate release on server" step, Passenger has nothing to serve except cPanel's stub. The fix is operational (provision two directories, set six secrets, trigger the workflow) — not a code change.

**Overall confidence: High** on RC-1 + RC-2 + RC-3 combined; the three failure modes are mutually reinforcing and all three need to be cleared for a green deploy.
