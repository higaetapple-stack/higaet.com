# SRE E2E Production Operations

Operational reference for the AI SRE end-to-end pipeline
(`/api/public/sre/e2e-trigger`, `runSreE2ETest`, GitHub PR automation).

## Required runtime environment variables (Lovable Cloud runtime)

| Variable | Purpose |
|---|---|
| `GITHUB_TOKEN` | Fine-grained PAT (or GitHub App installation token) that opens PRs and reads CI status |
| `GITHUB_REPO` | `owner/repo`, e.g. `higaetapple-stack/higaet` |
| `GITHUB_REPO_OWNER` | `higaetapple-stack` (mirror value) |
| `GITHUB_REPO_NAME`  | `higaet` (mirror value) |
| `SRE_E2E_TRIGGER_SECRET` | Bearer secret required by the trigger endpoint |
| `SUPABASE_URL` | Auto-injected by Lovable Cloud |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-injected by Lovable Cloud (server-only) |

Optional tuning:

| Variable | Default | Bounds |
|---|---|---|
| `SRE_CI_POLL_ATTEMPTS` | 40 | 1..120 |
| `SRE_CI_POLL_INTERVAL_MS` | 10000 | 1000..60000 |
| `SRE_CI_INITIAL_DELAY_MS` | 15000 | 0..60000 |

GitHub Actions workflow (`sre-e2e.yml`) also needs:

- `secrets.SRE_E2E_BEARER` — MUST equal server `SRE_E2E_TRIGGER_SECRET`.

## Required GitHub token permissions

Fine-grained PAT / App installation scoped to the target repo:

| Permission | Access | Consumer |
|---|---|---|
| Contents | Read & write | branch create, file commit |
| Pull requests | Read & write | open PR, label |
| Metadata | Read | default branch lookup |
| Checks | Read | `listCheckRunsForRef` |
| Actions | Read | `listWorkflowRunsForRef` |
| Commit statuses | Read | `listCombinedStatusForRef` |

The workflow's own `GITHUB_TOKEN` in `sre-e2e.yml` is reduced to
`contents: read` — the workflow only POSTs to the trigger URL; it never
writes to the repo.

## Endpoints

- `POST /api/public/sre/e2e-trigger` — runs the full smoke, bearer-protected.
- `GET  /api/public/sre/e2e-health` — public, no bearer. Returns 200 when
  `SRE_E2E_TRIGGER_SECRET` is configured, 503 otherwise. Suitable for
  external uptime monitors.

## Structured log events

Emit as single-line JSON so log pipelines can filter on `evt`.

| `evt` | Emitted from | Fields |
|---|---|---|
| `sre_trigger_health` | trigger + health routes | `configured`, `githubConfigured`, `environment`, `timestamp` |
| `sre_e2e_poll_config` | pipeline start | `attempts`, `intervalMs`, `initialDelayMs`, `maxWaitMs` |
| `sre_e2e_poll` | per poll attempt | `runId`, `prNumber`, `headSha`, `checkRuns`, `statuses`, `workflowRuns`, `verdict`, `reasons` |
| `sre_e2e_decision` | pipeline end | `runId`, `prNumber`, `prUrl`, `ciVerdict`, `readyForDeploy`, `overallStatus`, `signalsSeen` |

**No secret material** (tokens, bearer values) is ever logged. GitHub error
messages pass through `sanitizeGithubError` before being persisted.

## Alerting

- 503 on `/api/public/sre/e2e-health` → paging (misconfiguration).
- Any `sre_e2e_decision` with `overallStatus="failed"` → warning.
- Three consecutive `overallStatus="pending"` decisions → warning (CI
  slower than the poll window).

## Preflight check

```
bunx tsx scripts/check-sre-production-readiness.ts
```

Exit code 0 = ready; exit code 1 = missing/invalid config (details printed).
