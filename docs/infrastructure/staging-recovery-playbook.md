# Staging Recovery Playbook

Audience: on-call engineers responding to staging incidents during Phase 2.1+. Production procedures live separately in `docs/runbooks/`.

## Deployment Rollback

**Procedure**
1. Identify the failing deploy SHA in the GitHub Actions run.
2. SSH to staging: `ssh $SSH_USER@$STAGING_HOST`.
3. `cd ~/apps/higaet && PREV=$(cat .previous-release) && ln -sfn "$PREV" current`.
4. `touch tmp/restart.txt` to restart Passenger.
5. Automated path: re-run `staging-rollback-validation.yml` — it auto-rolls back on smoke or health failure.

**Validation**
- `curl -fsS $STAGING_BASE_URL/api/public/health` returns 200 within 60 s.
- `bun scripts/run-smoke-tests.ts` exits 0 with `SMOKE_BASE_URL=$STAGING_BASE_URL`.
- Provider-health dashboard renders without errors.

## DNS Recovery

1. Verify `dig +short staging.higaet.com` resolves to the MilesWeb origin IP.
2. If wrong, restore the `A staging → <origin IP>` record at the registrar. **Do not touch the apex `A`** (production).
3. Allow up to 30 min for propagation; bypass with `--resolve` for testing:
   `curl --resolve staging.higaet.com:443:<origin IP> https://staging.higaet.com/api/public/health`.

## Provider Failure Recovery

| Provider | Detection | Response |
| --- | --- | --- |
| OpenAI | 429/401 spike in `ai_usage`; `provider-health` shows breaker open. | Already auto-fails over to Gemini/OpenRouter (Phase 1.10/1.12). Confirm fallback rate ≤ 50%; if higher, set `OPENAI_ENABLED=false` in staging env and restart. |
| Gemini | 5xx spike on `chat.fast`. | Breaker auto-opens; traffic shifts to Groq + OpenRouter. Verify in dashboard. |
| Groq | Tool-call lane errors. | OpenRouter takes `chat.tools`; reduce concurrency on soak runs. |
| OpenRouter | Embedding + chat lanes affected simultaneously. | Pause embedding cron (`SELECT cron.unschedule('...');`), keep chat on Gemini+Groq, escalate. |

For all providers: capture the breaker state, latency, and 429 counts from `/dashboard/admin/provider-health` into the incident ticket.

## Embedding Failure Recovery

- **Fallback recovery:** Phase 1.12 already routes failed primary embeddings to OpenRouter. Verify in `provider-health → Embedding queue` that recent items succeeded.
- **Queue recovery:** From the dashboard, use **Requeue all dead** to retry. For targeted retries, filter by `failed` and use single/batch requeue.
- **Hard stop:** `SELECT cron.unschedule('embeddings-cron')` to pause ingestion; documents stay in `ai_documents` with `embedding_status='pending'`.

## Supabase Failure Recovery

| Subsystem | Symptom | Response |
| --- | --- | --- |
| Auth outage | `/auth` 5xx; sessions fail to refresh. | Disable new sign-ups (`HIGAET_STAGE` flag) and surface a maintenance banner. Wait for status.supabase.com. |
| Storage outage | Upload/download failures. | Pause file-upload features at the UI gate; cache-served reads continue. |
| Database outage | All RLS-protected reads fail. | Put staging into read-only mode by disabling write endpoints (feature flag); do **not** attempt manual failover. |

## Emergency Controls

- **Feature disable:** Toggle staging env vars (e.g. `HIGAET_STAGE=staging-maintenance`) and restart Passenger; route handlers gate on these.
- **Traffic reduction:** Lower `HEALTH_RL_LIMIT` to throttle abusers; for chat surfaces, reduce the existing chat limiter via env override.
- **Incident escalation:** Page on-call → file incident ticket → notify Phase 2.1 stakeholders → snapshot `provider-health` dashboard + `ai_usage` for last 1 h.
