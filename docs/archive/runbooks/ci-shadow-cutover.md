# CI Shadow-Mode Cutover Plan

Runbook for migrating from the legacy per-domain workflows to the P4 kernel
architecture **without deleting anything prematurely**.

Owner: DevOps. Status: in-flight.

---

## 0. Architecture at cutover start

```text
                     ┌─────────────────────────────────────────────┐
LEGACY (still on)    │ pr-checks.yml                               │  required check
                     │ seo-cluster-lint.yml                        │
                     │ seo-graph-report.yml                        │
                     │ dependency-audit.yml                        │
                     │ license-audit.yml                           │
                     │ deploy-milesweb.yml / -staging.yml          │  production
                     │ higaet-brevo-cicd.yml                       │  production
                     └─────────────────────────────────────────────┘

SHADOW (new, observe only)
                     ┌─────────────────────────────────────────────┐
                     │ ci.yml            matrix → _ci-kernel       │
                     │                            _security-kernel │
                     │ scheduled.yml     cron   → same             │
                     │ deploy.yml        manual → _deploy-kernel   │ dry-run only
                     └─────────────────────────────────────────────┘
```

Shadow workflows are **never required checks**. They cannot block merges,
cannot deploy, and cannot cancel legacy runs (separate concurrency groups).

---

## 1. Phase 1 — Shadow observation (minimum 5 clean runs on `main` + `staging`)

Goal: prove kernel parity with legacy for each domain.

Per push to `main`/`staging` and per PR, both systems run. For each domain,
record in a spreadsheet or tracking issue:

| Domain    | Legacy workflow            | Shadow job (ci.yml)            | Parity check                                                              |
| --------- | -------------------------- | ------------------------------ | ------------------------------------------------------------------------- |
| Core CI   | `pr-checks`                | `ci / core` (`_ci-kernel`)     | same lint/typecheck/build result on same SHA                              |
| SEO       | `seo-cluster-lint`, `seo-graph-report` | `ci / seo`         | same pass/fail; artifact `ci-shadow-seo` contains `dist/`                 |
| Security  | `dependency-audit`, `license-audit`    | `ci / security`    | same finding count; same failing packages                                 |
| Scheduled | weekly audits              | `scheduled.yml` (daily)        | at least 3 consecutive daily runs green                                   |
| Deploy    | `deploy-milesweb*`, `higaet-brevo-cicd` | `deploy.yml` (dry-run)  | dispatch each target once, confirm stub prints correct target             |

Exit criteria for Phase 1:
- ≥5 consecutive `main`+`staging` runs where **shadow result == legacy result**
  for every domain
- Zero unexplained divergences (a divergence = one green, one red on the same SHA)
- Any divergence: file an issue, do not advance

Rollback: delete the new workflow file. Legacy is untouched.

---

## 2. Phase 2 — Redirect (legacy → dispatch-only)

Only after Phase 1 exit criteria are met, per domain (not all at once):

1. Edit the legacy workflow's `on:` block: keep `workflow_dispatch: {}`, delete
   `push:`, `pull_request:`, `schedule:` triggers.
2. Update GitHub branch protection: replace the legacy required check with the
   corresponding shadow job (`ci / core`, etc.). This is the moment the shadow
   workflow becomes load-bearing.
3. Wait 3 consecutive green runs on the redirected domain before moving to the
   next domain.

Redirect order (lowest blast radius first):
1. `dependency-audit` + `license-audit` → covered by `ci / security` and `scheduled.yml`
2. `seo-cluster-lint` + `seo-graph-report` → covered by `ci / seo` and `scheduled.yml`
3. `pr-checks` → covered by `ci / core` (**this is the required-check swap; do
   this on a low-traffic day and keep the tab open**)
4. Deploy workflows: do NOT redirect until `_deploy-kernel.yml` is real (not the
   stub). Deploys stay on the legacy path throughout Phase 1 and Phase 2.

Rollback: revert the `on:` block edit; re-add the legacy required check in
branch protection. Takes <2 minutes.

---

## 3. Phase 3 — Delete (only after 3–5 clean redirected runs per domain)

Preconditions per file:
- Its triggers are dispatch-only for ≥1 week
- Zero manual dispatches needed during that week (proves the shadow covers it)
- It is no longer referenced by branch protection
- It is not referenced by any external integration (Datadog, Sentry, Brevo webhooks)

Only then: `rm` the legacy file in a dedicated PR titled `chore(ci): remove
<workflow> — superseded by kernel`. One workflow per PR so each deletion is
independently revertable.

Do NOT delete in Phase 3:
- `sentry-sourcemaps.yml` — still the sole source-map uploader
- `staging-rollback-validation.yml` — orthogonal, not covered by kernels
- `datadog-synthetics.yml` — external integration
- Anything under `authorization-verification.yml`, `phase-2-2-authorization.yml`
  until an explicit kernel replacement exists

---

## 4. Divergence triage checklist

When a shadow run and legacy run disagree on the same SHA:

1. Same runner? (`ubuntu-latest` on both — should be)
2. Same Node/Bun? (`setup-node-bun` composite on both — should be)
3. Same secrets scope? (shadow uses `secrets: inherit`; legacy may pin an
   Environment such as `staging`)
4. Same install path? (`bun install --frozen-lockfile` — should be)
5. Same script? (`bun run lint` etc. — check `package.json` hasn't drifted)

Most divergences are #3 (Environment-scoped secrets). Fix by pinning the
shadow job's Environment before advancing.

---

## 5. What P6 gave us (already landed)

- `setup-node-bun` caches `~/.bun/install/cache` keyed on `bun.lock`
- Lockfile safety gate — no npm/yarn fallback
- Concurrency on `ci.yml` (cancel superseded), `deploy.yml` (queue, never
  cancel), `scheduled.yml` (queue)

No behavior change for any existing caller — only new workflows opt into the
new concurrency groups.
