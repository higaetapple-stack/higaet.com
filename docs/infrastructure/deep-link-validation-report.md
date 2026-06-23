# Deep Link Validation

Every readiness run validates the artifact deep links surfaced in the
GitHub Actions step summary, the authorization gate output, and the
optional Slack/GitHub Issue notifications.

## What is validated

| Link | Validation |
| --- | --- |
| Readiness report (`docs/infrastructure/phase-2-2-prerequisite-report.md`) | File exists on disk after the run |
| Readiness history (`docs/infrastructure/staging-readiness-history.md`) | File exists on disk after the run |
| Workflow run URL | Non-empty; `https://` scheme when running in GitHub Actions |
| Evidence artifact URL | Non-empty; `https://` scheme when running in GitHub Actions |

Local runs (no `GITHUB_REPOSITORY`) substitute filesystem paths and are
marked `local` rather than `invalid`.

## Where validation runs

1. `scripts/check-staging-readiness.ts` calls `validateDeepLinks()` after
   the report, cache, and history are written.
2. Result is written to `test-results/readiness/<timestamp>/deep-link-validation.json`.
3. The `deep_links_ok` step output is exposed for downstream jobs.
4. `staging-readiness.yml` runs a `Validate deep links` step that emits a
   workflow warning if any link is invalid.
5. `phase-2-2-authorization.yml` consumes the same readiness run and
   therefore inherits the validation signal.

## Output schema

```json
{
  "ok": true,
  "details": [
    "report=ok",
    "history=ok",
    "run_url=ok",
    "artifact_url=ok",
    "report_url=ok",
    "history_url=ok"
  ]
}
```

## Failure handling

- Missing files mark `ok=false` and add `<name>=missing(<path>)` to
  `details`.
- Malformed URLs mark `ok=false` and add `<name>=invalid(<value>)`.
- The readiness workflow emits a `::warning::` rather than failing the
  run, because deep-link drift should surface but not block infrastructure
  visibility. A future iteration can flip this to a hard fail once the
  pipeline has cleared two consecutive PASSes.
