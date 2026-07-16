# GitHub Workflow Permissions Audit

Every workflow in `.github/workflows/` declares an explicit top-level `permissions:`
block. Job-level overrides are listed when they widen or narrow the default.

| Workflow | contents | issues | actions | pull-requests | id-token | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `higaet-brevo-cicd.yml` | read | write | read | — | — | `issues:write` for autonomous incident + audit issues; `actions:read` for predictive analytics over recent runs. |
| `staging-readiness.yml` | write | write | read | — | — | `contents:write` to commit regenerated readiness report + history; `issues:write` for FAIL→PASS notifications. |
| `launch-readiness.yml` | read | write | read | — | — | Issues for launch incident notifications. |
| `phase-2-2-authorization.yml` | read | write | read | — | — | Issues for authorization gate failures. |
| `authorization-verification.yml` | read | write | read | — | — | Issues for verification regressions. |
| `staging-rollback-validation.yml` | read | write | read | — | — | Issues for rollback regressions. |
| `deploy-milesweb.yml` | read | — | — | — | — | Deployment only; no GitHub API writes. |
| `datadog-synthetics.yml` | read | — | — | — | — | Synthetics trigger; no GitHub API writes. |

## Runtime context logging

`higaet-brevo-cicd.yml` and `staging-readiness.yml` run a `Workflow context` step
at the start of each job, printing:

- Workflow name, repository, ref, event name
- Actor and triggering actor
- Run id, run attempt
- Job name, runner OS
- Effective `GITHUB_TOKEN` scopes (visible via `gh auth status` where available)

This output is in plain text in each job log, immediately under the preflight
validation step, so reviewers can confirm the effective identity used by the run
without digging through nested API calls.

## Adding a new workflow

When introducing a workflow that touches the GitHub API:

1. Start with the minimum baseline: `contents: read, actions: read, issues: write`.
2. Only widen (`contents: write`, `pull-requests: write`, `id-token: write`) when
   the workflow has a documented reason — record it in the table above in the
   same PR.
3. Add the shared **Workflow context** and **Preflight validation** steps
   (see `docs/ci/preflight-requirements.md`).
