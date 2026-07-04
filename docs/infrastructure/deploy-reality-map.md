# Deploy Reality Map

Owner: DevOps. Status: discovery — no implementation authorized.

## Purpose

Document what deployment mechanisms actually exist in this repository before
introducing any deploy kernel or CI/CD automation. This file is the gate:
`_deploy-kernel.yml` cannot become non-stub until this map is complete and
signed off.

## Rule

No deploy workflow abstraction, refactor, or "kernelization" is allowed
until every section below is filled in with evidence (file paths, commit
SHAs, tested commands). Assumption-based changes are rejected on review.

## What is currently known

- No canonical deploy workflow exists in `.github/workflows/`. There is no
  `deploy-milesweb.yml`, no `deploy-milesweb-staging.yml`, no Brevo CI/CD
  workflow file.
- `.github/workflows/deploy.yml` is a `workflow_dispatch`-only orchestrator
  that currently calls `_deploy-kernel.yml` — which is itself a dry-run stub.
  Neither produces a real deployment today.
- The closest behavioral signal for production-shaped deploy steps lives in
  `.github/workflows/staging-rollback-validation.yml` and the reports under
  `docs/infrastructure/phase-2-*`.
- Deployment intent (SCP layout, Passenger restart, symlink swap, health
  probes, rollback) is documented in
  `docs/infrastructure/phase-2-0-2-rollback-validation-report.md` but the
  actual production pipeline that would execute it is not wired up.

## What is NOT confirmed (must be filled in before implementation)

Fill each row with a repo path or a tested command. "TBD" is not acceptable
for sign-off.

| Question | Answer / Evidence |
| --- | --- |
| MilesWeb transfer mechanism (SCP / rsync / other) | TBD |
| Release directory layout on the host | TBD (assumed `~/apps/higaet/releases/<sha>` — unverified) |
| Symlink swap command actually used in production | TBD |
| Passenger restart trigger (file touch? signal?) | TBD (assumed `tmp/restart.txt` — unverified) |
| Health-probe endpoint contract | `/api/public/health` — verify response shape |
| Rollback command actually used in production | TBD (see phase-2-0-2 report for design) |
| Brevo integration surface (transactional / marketing / webhook) | TBD |
| Brevo credentials scope + rotation policy | TBD |
| DNS cutover ownership (who flips, who verifies) | See `docs/infrastructure/dns-cutover-plan.md` — confirm still current |
| Secrets required at deploy time (full list) | TBD |
| Where deploy shell scripts live (if any) | Audit `scripts/` — confirm none, or list them |

## Required next step (discovery, not implementation)

1. Walk the host manually (or with the DevOps owner) and record the real
   commands used for the last successful deploy. Paste them into the table
   above.
2. Diff the recorded reality against
   `docs/infrastructure/phase-2-0-2-rollback-validation-report.md`. Flag any
   drift as an issue.
3. Only after every row is populated with evidence: draft a
   `docs/infrastructure/deploy-kernel-spec.md` describing the concrete
   `_deploy-kernel.yml` inputs, steps, and rollback contract.
4. Only after that spec is reviewed: replace the `_deploy-kernel.yml` stub.

## Explicitly out of scope for this document

- Designing `_deploy-kernel.yml`.
- Consolidating deploy workflows.
- Choosing between SCP and rsync, or between Passenger restart strategies.

These decisions require the evidence table above to be complete first.
