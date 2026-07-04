# P10 Stabilization Spec

> Status: **active**. This spec closes out the CI/CD collapse work (P4–P9)
> and defines the hardening layer that sits on top of the stable kernels.
> No new workflows, no new kernel splits, no new matrix lanes. Only
> integrity, contracts, observability, and rollback.

## 0. Scope guardrails (non-negotiable)

- Do **not** add new top-level workflows. `ci.yml`, `deploy.yml`,
  `scheduled.yml`, `parity-gate.yml`, `ci-integrity-guard.yml` are the
  only allowed entrypoints. Everything else is a reusable `_*-kernel.yml`.
- Do **not** split existing kernels further.
- Do **not** reintroduce per-domain build steps. Every consumer of
  `dist/` must download the `_ci-kernel` artifact instead of rebuilding.
- Do **not** delete `pr-checks.yml` until `parity-gate` has been green
  for 14 consecutive days (tracked in `docs/runbooks/ci-parity.md`).

## 1. Artifact integrity (enforced by `ci-integrity-guard.yml`)

Single source of truth for build output:

| Producer | Consumer | Contract |
|---|---|---|
| `_ci-kernel` (`upload-artifact: true`) | `_deploy-kernel`, Lighthouse, SEO post-build, smoke | Must `download-artifact` — never `bun run build` a second time in the same run graph. |

Guard rules:

1. Any workflow file (other than `_ci-kernel.yml` itself) that contains
   `bun run build` or `npm run build` triggers a **HIGH** finding.
2. Any workflow that both `download-artifact`s and rebuilds is a
   **CRITICAL** finding (double-build = artifact drift).
3. `dist/` and `.output/` must never be committed. `.gitignore` is the
   backstop; the guard is the tripwire.

Implementation: `ci-integrity-guard.yml` runs on every PR and pushes to
`main`/`staging`, greps the `.github/workflows/**` tree, and fails the
job on any violation. Findings are uploaded as `integrity-report.md`.

## 2. Kernel contract lock

Each reusable kernel exposes a stable input/output surface. Changes to
these contracts require an ADR under `.lovable/adr/` and a version bump
in the kernel's leading comment block.

### `_ci-kernel.yml`

- **Inputs (frozen):** `node-version`, `run-lint`, `run-typecheck`,
  `run-build`, `upload-artifact`, `artifact-name`, `build-command`, `mode`.
- **Outputs (frozen):** artifact `{artifact-name}` containing `dist/`
  and/or `.output/`, plus `{artifact-name}-logs` with `lint.log`,
  `typecheck.log`, `build.log`.
- **Failure modes:** exits non-zero if build produces neither `dist/`
  nor `.output/`.

### `_deploy-kernel.yml`

- **Inputs (frozen):** `target` (`staging` | `production` | `brevo`),
  `artifact_name` (default `dist`).
- **Contract:** consumes prebuilt artifact — never rebuilds. Server-side
  validation runs on the release folder BEFORE symlink swing.
- **Outputs:** release id (in-log), `~/.previous-release` file on host
  for manual rollback.

### `_security-kernel.yml`

- **Inputs (frozen):** `run-dependency-audit`, `run-license-audit`,
  `severity-threshold`.
- **Outputs:** JSON summary uploaded as `security-report`.

### `_seo-kernel.yml`

- **Inputs (frozen):** none currently — invoked from `scheduled.yml`.
- **Outputs:** `seo-graph-report.md`, `seo-cluster-report.md`.

Contract violation = build fails. There is no soft mode.

## 3. Observability layer (deferred — sized here for planning)

Missing today. Sized as follow-on work, not in this batch:

- **Trace ID:** every workflow injects `RUN_ID=${{ github.run_id }}-${{
  github.run_attempt }}` into logs and artifact names.
- **Unified summary:** a `summary-kernel.mjs` script consumes all
  `*-logs` artifacts of a run and writes a single `run-summary.md` to
  the run's `$GITHUB_STEP_SUMMARY`.
- **Failure surface:** `scripts/notify-failure.mjs` (already present)
  extended to include the summary link.

Explicitly **out of scope** for this P10 pass. Tracked as follow-up.

## 4. Rollback + safety (shipped in this batch)

Extends `_deploy-kernel.yml` with automatic symlink revert on smoke
failure. See §Rollback semantics below and the kernel file itself.

### Rollback semantics

1. Before symlink swing, kernel records the previous release path into
   `$DEPLOY_DIR/.previous-release`.
2. Symlink is atomically swung to the new release.
3. Passenger is restarted.
4. Smoke tests run against the live release.
5. **If smoke tests fail** and a previous release path exists:
   - Symlink is atomically swung back to previous release.
   - Passenger is restarted again.
   - Job exits non-zero so the caller (deploy.yml) surfaces the failure.
6. If smoke tests pass, previous release is retained on disk for manual
   rollback but symlink stays on the new release.

Failed release folders are **not** auto-deleted — kept for forensic
inspection. Cleanup is a separate scheduled job (future work).

## 5. What P10 explicitly does NOT do

- No autonomous release ops (P10-plus / P11 territory).
- No predictive failure simulation.
- No AI-based PR risk scoring.
- No multi-region coordination.
- No self-hosted runner migration (P9 territory).

If any of these appear in a future PR, they must land as a separate ADR
and their own workflow, not as edits to the kernels.

## 6. Acceptance criteria

- [x] `docs/infrastructure/p10-stabilization-spec.md` exists (this file).
- [x] `.github/workflows/ci-integrity-guard.yml` exists and runs on PR.
- [x] `_deploy-kernel.yml` reverts symlink automatically on smoke failure.
- [ ] Observability layer (§3) tracked as follow-up issue.
- [ ] `pr-checks.yml` deleted after 14 green parity-gate days.
