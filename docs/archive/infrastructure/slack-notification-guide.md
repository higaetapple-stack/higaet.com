# Slack Notification Guide

Optional Slack notification for the `NO-GO → GO` readiness transition.
Configured via a single GitHub Actions secret. Failures never block the
workflow.

## Secret

| Name | Scope | Format |
| --- | --- | --- |
| `SLACK_WEBHOOK_URL` | Repository or `staging` environment | `https://hooks.slack.com/services/T.../B.../...` |

### Validation rules

- Must begin with `https://`.
- Must be non-empty.
- Webhook errors are logged as workflow warnings — they MUST NOT fail the
  readiness job (`curl ... || echo "::warning::Slack notification failed"`).

## Trigger condition

| Prior status | New status | Notify? |
| --- | --- | --- |
| `NO-GO` | `GO` | ✅ yes |
| `none` (first run) | `GO` | ✅ yes (treated as transition) |
| `GO` | `GO` | ❌ no |
| `NO-GO` | `NO-GO` | ❌ no |
| `GO` | `NO-GO` | ❌ no (regression handled via GitHub Issue + workflow failure) |

The transition flag is emitted by the checker as the `transitioned` output
of `Run readiness checker` and consumed by `if: steps.check.outputs.transitioned == 'true'`.

## Example message

```
*STAGING READY* — readiness transitioned to GO
• Time: 2026-06-23T12:00:00Z
• Run: https://github.com/<owner>/<repo>/actions/runs/<id>
• Report: https://github.com/<owner>/<repo>/blob/main/docs/infrastructure/phase-2-2-prerequisite-report.md
• Evidence: https://github.com/<owner>/<repo>/actions/runs/<id>#artifacts

Authorization: Phase 2.2 may now proceed.
```

## Troubleshooting

| Symptom | Likely cause | Resolution |
| --- | --- | --- |
| Notification step skipped | `SLACK_WEBHOOK_URL` not set | Add the secret (intended behavior — silent when unset). |
| Workflow log: `Slack notification failed` | Webhook URL invalid / channel deleted | Recreate webhook in Slack; update secret. |
| `HTTP 403` from Slack | Workspace revoked the app | Reinstall the Slack app or generate a new incoming webhook. |
| `HTTP 429` rate limit | Burst of transitions (unlikely with daily cron) | Acceptable — drop is logged, GitHub Issue is the authoritative notification. |
| Repeated notifications for the same GO | History file lost between runs (cache miss) | Inspect `docs/infrastructure/staging-readiness-history.md` and reseed last row. |

GitHub Issue notification remains **mandatory** and is independent of Slack.
