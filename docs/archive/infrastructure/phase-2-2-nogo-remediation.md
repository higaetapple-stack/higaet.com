# Phase 2.2 — NO-GO Remediation Audit

Scope: infrastructure / CI-CD only. No application, Supabase, Stripe, or
Vite runtime code was modified.

## Symptom (from the failing gate)

| Category           | Status  |
| ------------------ | ------- |
| DNS                | ✅ PASS |
| SSL                | ✅ PASS |
| SSH                | ❌ FAIL |
| GitHub Environment | ❌ FAIL |
| Required Secrets   | ❌ FAIL |
| Deploy Directory   | ❌ FAIL |
| Node Runtime       | ⚠️ WARN |
| Passenger Restart  | ❌ FAIL |
| **Result**         | **NO-GO** |

DNS + SSL passing prove the target host is real and reachable on 443.
Every other failure chains off two independent root causes.

## Root causes

1. **SSH port not configured at run time.**
   Every workflow already reads `secrets.SSH_PORT` with a `|| 22` fallback
   (see `docs/infrastructure/phase-2-2-infrastructure-remediation.md`).
   If the secret is not present in the resolved scope, ssh dials port 22
   and MilesWeb rejects the connection. That single failure cascades into
   `SSH`, `Deploy Directory`, and `Passenger Restart` (all three probe
   over the same ssh channel).

2. **`staging` environment secrets not populated.**
   The checker's GitHub probe hits
   `GET /repos/{repo}/environments/staging/secrets`. A 404 means the
   `staging` environment does not exist; a 200 with an empty list means
   the environment exists but nothing was added to it. Either way,
   `GitHub Environment` + `Required Secrets` fail.

The `Node Runtime` warning was a separate defect: the checker was
hardcoded to require Node **20.x**, so a MilesWeb account on Node 24 LTS
would always fail even though 24 is a supported target for this app.

## Fixes applied in this repo

| File | Change |
| ---- | ------ |
| `scripts/check-staging-readiness.ts` | Accept Node ≥20 (20 and 24 LTS both pass). Rename the check to "Node ≥20 available (20 or 24 LTS)". |
| `scripts/check-staging-readiness.ts` | Required-secret probe now also inspects **repository-scope** secrets (`GET /repos/{repo}/actions/secrets`). A secret satisfies the check if it is present at env scope OR repo scope, and the evidence line records which scope. |
| `scripts/check-staging-readiness.ts` | Step-summary "Node Runtime" row now matches the new check name. |

No other file needed a change — the SSH/port fixes from
`phase-2-2-infrastructure-remediation.md` are still in place across
every workflow that touches the MilesWeb host (`deploy-milesweb.yml`,
`staging-rollback-validation.yml`, `higaet-brevo-cicd.yml`, and the
readiness workflow itself).

## Workflow inventory (SSH surface)

| Workflow                                            | Port source                            | OK? |
| --------------------------------------------------- | -------------------------------------- | --- |
| `.github/workflows/staging-readiness.yml`           | `secrets.SSH_PORT \|\| '22'` → checker | ✅  |
| `.github/workflows/deploy-milesweb.yml`             | `secrets.SSH_PORT \|\| 22`             | ✅  |
| `.github/workflows/staging-rollback-validation.yml` | `secrets.SSH_PORT \|\| 22`             | ✅  |
| `.github/workflows/higaet-brevo-cicd.yml`           | `-p "$SSH_PORT"`                        | ✅  |
| `.github/workflows/deploy-milesweb-staging.yml`     | `secrets.MILESWEB_SSH_PORT`             | ✅ (isolated cPanel workstream) |
| `.github/workflows/phase-2-2-authorization.yml`     | n/a — cache key only                    | ✅ (includes `SSH_PORT` in cache key)   |

No workflow now hardcodes port 22 on the deployment path.

## Manual actions still required (GitHub Settings)

The AI agent cannot write GitHub secrets. Do these once, in this order:

1. **Repository → Settings → Environments → `staging`.**
   Create it if the environment does not exist.
2. **Environment secrets** — add the following at `staging` scope:
   - `SSH_HOST` = `103.102.234.161`
   - `SSH_PORT` = `22999`
   - `SSH_USER` = `wnwpopno`
   - `SSH_KEY`  = *(the OpenSSH private key contents — full PEM, including `-----BEGIN` / `-----END` lines)*
   - `STAGING_HOST` = `staging.higaet.com`
   - `STAGING_BASE_URL` = `https://staging.higaet.com`
3. **Repository → Settings → Secrets and variables → Actions → Secrets.**
   Add the same six names at repo scope (safe redundancy: the readiness
   checker now accepts either scope, and non-`staging` workflows that
   don't declare an `environment:` see only repo-scope secrets).
4. **Repository → Settings → Secrets and variables → Actions → Variables.**
   - `STAGING_EXPECTED_IP` = `103.102.234.161`
   - `DEPLOY_DIR` = `~/apps/higaet` (optional — checker defaults to this)

Do **not** rename `SSH_*` to `MILESWEB_*`. The `MILESWEB_*` set is used
only by `deploy-milesweb-staging.yml` (an isolated cPanel workstream);
mixing the two namespaces is what caused the earlier confusion.

## Validation

Once the secrets above are provisioned, re-run **Phase 2.2
Authorization Gate** (`workflow_dispatch`) on `main`. Expected result:

| Check              | Expected |
| ------------------ | -------- |
| DNS                | ✅ PASS |
| SSL                | ✅ PASS |
| SSH                | ✅ PASS (`wnwpopno@103.102.234.161:22999`) |
| GitHub Environment | ✅ PASS |
| Required Secrets   | ✅ PASS (env or repo scope) |
| Deploy Directory   | ✅ PASS (`~/apps/higaet/releases` writable) |
| Node Runtime       | ✅ PASS (Node 20 or 24 LTS) |
| Passenger Restart  | ✅ PASS (`~/apps/higaet/tmp/restart.txt` touched) |
| **Result**         | **GO**  |

If any row still fails after the secrets are set, the failing category
maps 1:1 to the remediation:

- SSH FAIL → the private key stored in `SSH_KEY` does not match the
  MilesWeb account's `~/.ssh/authorized_keys`, or the key has a
  passphrase (unsupported in CI). Regenerate an ed25519 keypair with no
  passphrase, add the public half to MilesWeb, replace `SSH_KEY`.
- Deploy Directory FAIL after SSH PASS → the cPanel user does not own
  `~/apps/higaet`. SSH in manually and run
  `mkdir -p ~/apps/higaet/{releases,tmp}`.
- Passenger Restart FAIL after SSH PASS → the app is not configured as
  a Passenger app in cPanel yet, so `tmp/restart.txt` has no effect.
  Create the Node.js app in cPanel first, then re-run.
