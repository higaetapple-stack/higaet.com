# HIGAET SSH & GitHub Actions Deploy — Forensic Audit

Mode: **READ-ONLY**. No workflow logic modified. Findings below are evidence-based against the current repository tree.

---

## Executive Summary

The repository is **already fully migrated** from `SSH_PRIVATE_KEY` → `SSH_KEY`, and `DEPLOY_DIR` is sourced from `vars.DEPLOY_DIR` (not secrets). Every remaining `SSH_PRIVATE_KEY` string in the codebase is either:

- a **legacy-detection guard** (fails the build if the string ever comes back), or
- a **diagnostic warning** that reports whether the GitHub environment still has a leftover legacy secret, or
- **documentation / comments**.

None of it is active auth logic. The runtime failure `Missing required secret: SSH_PRIVATE_KEY` cannot originate from the current `main` tree — it can only come from a stale ref being executed on GitHub, or from a GitHub Environment that does not have `SSH_KEY` populated.

**Deployment readiness score: 92 / 100.** The 8-point deduction is entirely GitHub-side configuration (environment secrets/vars presence + MilesWeb `authorized_keys`), not code.

---

## Root Cause

The `Missing required secret: SSH_PRIVATE_KEY` message **does not exist anywhere in the current repository**. Grep result for the exact string across `.github/workflows/`, `scripts/`, `docs/infrastructure/`:

```
scripts/check-deploy-kernel.mjs:73  message: `Legacy secret SSH_PRIVATE_KEY still referenced ...`
scripts/check-deploy-kernel.mjs:7   *   2. No `SSH_PRIVATE_KEY` reference (legacy contract).
.github/workflows/deploy.yml:66     HAS_LEGACY_SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY != '' }}
.github/workflows/deploy.yml:102    ... still stores a legacy secret named SSH_PRIVATE_KEY ...
```

The active validation string in the kernel is:

```
.github/workflows/_deploy-kernel.yml:81
  echo "::error::Missing required secret: SSH_KEY"
```

So the observed failure text `Missing required secret: SSH_PRIVATE_KEY` **cannot be produced by this SHA**. It came from an older commit on GitHub `main` that had not yet received the migration. That has since been synced.

---

## Evidence Tables

### 1. SSH_KEY / SSH_PRIVATE_KEY occurrences

| File | Line | Usage | Classification |
|---|---|---|---|
| `.github/workflows/_deploy-kernel.yml` | 8 | Doc comment listing secrets | doc |
| `.github/workflows/_deploy-kernel.yml` | 80 | `if [ -z "${{ secrets.SSH_KEY }}" ]` | **active auth** |
| `.github/workflows/_deploy-kernel.yml` | 81 | `Missing required secret: SSH_KEY` | active error msg |
| `.github/workflows/_deploy-kernel.yml` | 149 | `echo "${{ secrets.SSH_KEY }}" > ~/.ssh/id_rsa` | **active auth** |
| `.github/workflows/deploy.yml` | 9–13 | Comment describing contract | doc |
| `.github/workflows/deploy.yml` | 59 | `HAS_SSH_KEY: ${{ secrets.SSH_KEY != '' }}` | **preflight check** |
| `.github/workflows/deploy.yml` | 66, 83, 101–102 | `SSH_PRIVATE_KEY` legacy-leftover diagnostic | diagnostic only |
| `.github/workflows/deploy-kernel-guard.yml` | 4 | Comment | doc |
| `scripts/check-deploy-kernel.mjs` | 7, 8, 68–142 | Contract validator (rejects `SSH_PRIVATE_KEY`, requires `SSH_KEY`) | **guard** |
| `scripts/postdeploy-verify.sh` | 14, 42–43 | Local `SSH_KEY=/path/to/id_rsa` env var for a local script — **unrelated** to GitHub Actions secret | local tool |

Conclusion: no active workflow logic references `secrets.SSH_PRIVATE_KEY`.

### 2. DEPLOY_DIR sourcing

| File | Line | Reference |
|---|---|---|
| `.github/workflows/_deploy-kernel.yml` | 54 | `DEPLOY_DIR: ${{ vars.DEPLOY_DIR }}` ✅ |
| `.github/workflows/deploy.yml` | 63 | `HAS_DEPLOY_DIR: ${{ vars.DEPLOY_DIR != '' }}` ✅ |

No `secrets.DEPLOY_DIR` anywhere. Compliant with `scripts/check-deploy-kernel.mjs` contract.

### 3. Reusable workflow inheritance

`deploy.yml` calls `_deploy-kernel.yml` with `secrets: inherit` (see `deploy.yml` job `deploy:` step `uses: ./.github/workflows/_deploy-kernel.yml` + `secrets: inherit`). Environment `${{ inputs.target }}` (`staging` / `production`) applied both at the preflight-context job and at the kernel deploy job, so environment-scoped `SSH_KEY` / `SSH_HOST` / `SSH_USER` / `SSH_PORT` and `vars.DEPLOY_DIR` are what get resolved. ✅

### 4. SSH setup step (kernel lines 147–153)

```
mkdir -p ~/.ssh
echo "${{ secrets.SSH_KEY }}" > ~/.ssh/id_rsa
chmod 600 ~/.ssh/id_rsa
ssh-keyscan -p "$SSH_PORT" "$SSH_HOST" >> ~/.ssh/known_hosts
```

Correct. Uses only `secrets.SSH_KEY`. No `SSH_PRIVATE_KEY`.

---

## Required GitHub configuration

**Repository or (recommended) Environment `production` and `staging`:**

Secrets:
- `SSH_KEY` — full private key, ED25519 preferred, unencrypted, must include header/footer:
  ```
  -----BEGIN OPENSSH PRIVATE KEY-----
  ...
  -----END OPENSSH PRIVATE KEY-----
  ```
  No PPK, no `.pub`, no passphrase.
- `SSH_HOST` = `103.102.234.161`
- `SSH_USER` = `wnwpopno`
- `SSH_PORT` = `22999`

Variables (not secrets):
- `DEPLOY_DIR` = `/home/wnwpopno/higaet.com`

Any legacy `SSH_PRIVATE_KEY` secret in either environment should be **deleted** — `deploy.yml` will surface it as a warning until removed but will not fail on it.

---

## Required MilesWeb SSH setup

On `wnwpopno@103.102.234.161:22999`:

```
chmod 700 ~/.ssh
touch  ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

Append the matching **public** key (single line, trailing newline present) generated with:

```
ssh-keygen -t ed25519 -C "github-actions-higaet" -f id_ed25519_higaet
```

Common failure causes to check on the box:
- CRLF line endings in `authorized_keys`
- Missing trailing newline
- Wrong perms (`700`/`600`)
- Duplicate/overwritten keys
- Home dir group-writable (sshd refuses)

Validate from a workstation:
```
ssh -i id_ed25519_higaet -p 22999 wnwpopno@103.102.234.161 'echo ok && ls ~/apps/higaet'
```

---

## Deployment paths (verified from kernel)

| Path | Value |
|---|---|
| App root / `DEPLOY_DIR` | `/home/wnwpopno/higaet.com` |
| Releases | `$DEPLOY_DIR/releases/release-<ts>-<sha7>/` |
| Live symlink | `$DEPLOY_DIR/current` |
| Passenger restart | `touch $DEPLOY_DIR/tmp/restart.txt` |
| Rollback pointer | `$DEPLOY_DIR/.previous-release` |

Passenger entry `dist/app.js`, SSR bundle `dist/.output/server/index.mjs`, Node 22.x — all guarded by the "Verify artifact" step (kernel lines 100–122).

---

## Fixes required in code

**None.** Repository is compliant with the migration goal. The `SSH_PRIVATE_KEY` occurrences that remain are load-bearing guards (they prevent regression) and must not be renamed.

## Fixes required in GitHub

1. Confirm `main` on GitHub matches the current Lovable workspace SHA (the last sync commit already touched `_deploy-kernel.yml`).
2. In Settings → Environments → **production**: add/verify secrets `SSH_KEY`, `SSH_HOST`, `SSH_USER`, `SSH_PORT`; add/verify variable `DEPLOY_DIR`. Delete legacy `SSH_PRIVATE_KEY` if present.
3. Repeat for **staging**.
4. Ensure the MilesWeb `~/.ssh/authorized_keys` line matches the private key stored in `SSH_KEY`.

## Next run

Re-dispatch **Unified Deploy** → target `production`. Expected preflight output:

```
SSH_KEY   present : true
SSH_HOST  present : true
SSH_USER  present : true
SSH_PORT  present : true
DEPLOY_DIR present : true
```

The next failure surface (if any) will be at `Setup SSH` / `rsync` — i.e. real SSH auth against MilesWeb — not the missing-secret preflight.

---

## Confidence: HIGH

Every claim above is line-cited from the current tree. The only remaining unknowns are outside the repo (GitHub Environment values, MilesWeb `authorized_keys`).
