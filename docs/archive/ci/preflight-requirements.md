# CI Preflight Requirements

Both `higaet-brevo-cicd.yml` and `staging-readiness.yml` run a `Preflight validation`
step before any network calls or deployments. It validates every required secret
and variable, prints the exact missing names with a one-line reason, and exits
with `::error::` + non-zero status when anything is missing.

A passing preflight logs:

```text
✅ All required secrets and variables validated.
```

A failing preflight logs (example):

```text
❌ Missing secret: BREVO_API_KEY
   Required for Brevo email gateway verification.
❌ Missing variable: STAGING_EXPECTED_IP
   Required to verify staging DNS resolves to the expected origin.
```

## Dependency matrix

### `higaet-brevo-cicd.yml`

| Name | Kind | Required | Purpose |
| --- | --- | --- | --- |
| `BREVO_API_KEY` | secret | yes | Authenticates the Brevo API health probe. |
| `APP_BASE_URL` | secret | yes | Base URL for `/api/public/email-verify` round-trip. |
| `LAUNCH_READINESS_INGEST_SECRET` | secret | yes | Bearer for the email-verify endpoint. |
| `CI_AUDIT_INGEST_SECRET` | secret | yes | HMAC key for posting audit + ingest-failure diagnostics to the Ops dashboard. Must match the value in Lovable Cloud secrets. |
| `OPS_DASHBOARD_URL` | secret | yes | Base URL of the dashboard receiving audit POSTs. |
| `SLACK_WEBHOOK_URL` | secret | optional | Incident / risk / health Slack notifications. |
| `DEPLOY_WEBHOOK_URL` | secret | optional | Auto-deploy execution target. |
| `CANARY_WEBHOOK_URL` | secret | optional | Canary execution target. |
| `ROLLBACK_WEBHOOK_URL` | secret | optional | Auto-rollback execution target. |
| `SYSTEM_MODE` | variable | optional (default `NORMAL`) | `NORMAL` or `FREEZE`. |
| `AUTONOMOUS_MODE` | variable | optional (default `ENABLED`) | `ENABLED` or `DISABLED`. |

### `staging-readiness.yml`

| Name | Kind | Required | Purpose |
| --- | --- | --- | --- |
| `STAGING_HOST` | secret | yes | Hostname for DNS + SSL probes. |
| `STAGING_BASE_URL` | secret | yes | Base URL for HTTP readiness probes. |
| `STAGING_EXPECTED_IP` | variable | yes | Expected origin IP for DNS verification. |
| `SSH_HOST` | secret | optional | Enables SSH connectivity probe. |
| `SSH_USER` | secret | optional | Required when `SSH_HOST` is set. |
| `SSH_KEY` | secret | optional | Required when `SSH_HOST` is set. |
| `DEPLOY_DIR` | variable | optional (default `~/apps/higaet`) | Target directory for deploy probe. |
| `READINESS_GH_TOKEN` | secret | optional | Falls back to `GITHUB_TOKEN`. |
| `SLACK_WEBHOOK_URL` | secret | optional | FAIL→PASS transition notification. |

## Validation logic

The preflight step is intentionally simple, fast, and self-explanatory:

1. Walk the required list.
2. For each entry, check that the env-injected value is non-empty.
3. Echo a `::error::` for every missing entry with its purpose.
4. After the walk, exit `1` if any entry was missing.
5. Otherwise echo the success line and continue.

This keeps cascading downstream failures (and noisy retries against a missing
key) from polluting the timeline.
