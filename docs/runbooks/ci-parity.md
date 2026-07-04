# CI Parity Runbook

Owner: DevOps. Status: active during kernel migration.

## Purpose

This repository is transitioning from the legacy CI signal (`pr-checks.yml`)
to a kernel-based CI system (`ci.yml` → `_ci-kernel.yml`). Parity ensures the
new system does not silently regress checks that legacy already enforces.

## Scope (deliberately small)

Only two lanes are compared:

| Lane | Source |
| --- | --- |
| Kernel CI | `ci.yml` core matrix job (`_ci-kernel.yml` with `mode: core`) |
| Legacy baseline | `pr-checks.yml` (lint + typecheck + build) |

Not in scope for this workflow: SEO, security audits, deploy, scheduled runs.
Do not expand `parity-gate.yml` to cover those unless a corresponding legacy
workflow actually exists in the repo.

## How it works

`.github/workflows/parity-gate.yml` runs on every pull request. It executes
two lanes on the same commit:

- `ci-run` — calls the kernel via `workflow_call`.
- `legacy-run` — inlines the legacy `pr-checks` steps (checkout, setup,
  lint, typecheck, build) so both lanes share the same runner topology.

A third job, `parity-gate (stable)`, compares `needs.*.result` and:

- prints a summary table into the GitHub run summary,
- uploads `parity-report.md` as an artifact (30-day retention),
- fails the check when the two lanes disagree.

Legacy step logs are uploaded as `parity-legacy-logs` for offline diffing.

## Required status check (manual step)

GitHub Actions cannot mark itself required. A repo admin must configure this
once in **Settings → Branches → Branch protection rules**:

1. Edit the rule for `main` (and `staging` if protected).
2. Enable **Require status checks to pass before merging**.
3. Add: `parity-gate (stable)` — the exact `name:` of the gate job.
4. Enable **Require branches to be up to date** to prevent stale-base merges.

Do not rename the `parity-gate` job in `parity-gate.yml` without updating the
required-check name in branch protection at the same time.

## When parity fails

1. Open the failing PR's `parity-gate (stable)` step summary.
2. Download the `parity-legacy-logs` and `parity-ci-core-logs` artifacts.
3. Diff the failing lane's log against the passing lane. Common causes:
   - Different Node/Bun versions (both should use `setup-node-bun`).
   - Environment-scoped secrets attached to one lane but not the other.
   - `package.json` script drift between what the kernel runs and what
     `pr-checks` runs.
4. Fix the divergence in the same PR before merging.

## Current limitation

Runtime-duration comparison is intentionally not implemented. Add it only if
divergence patterns appear that duration data would explain.

## Related

- `docs/runbooks/ci-shadow-cutover.md` — full 3-phase kernel cutover plan.
- `.github/workflows/_ci-kernel.yml` — the kernel invoked by both `ci.yml`
  and `parity-gate.yml`.
