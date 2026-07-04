
# Unified Sentry → AI SRE Pipeline

One brain, two inputs (webhook + cron backfill), one persisted analysis, optional PR draft. No duplicate paths.

## Architecture

```text
Sentry webhook  ─┐
                 ├─► processSentryIssue(issueId)  ──►  runAISRELoop()  ──►  persist analysis  ──►  (optional) PR draft
pg_cron backfill ─┘        (dedupe by issueId)
```

Single entrypoint: `processSentryIssue(issueId, { trigger })`. Both webhook and cron call it. It:
1. Loads issue + latest event via existing `SentryClient`.
2. Skips if `sentry_issue_analyses` already has a fresh row for that `issueId` (status = processed, updated within TTL) unless `force=true`.
3. Runs `runAISRELoop()` (already built).
4. Upserts result into `sentry_issue_analyses`.
5. If `autoPRRecommended` and PR not yet created for this analysis version, generates a PR draft record (no external Git call in this pass — stored as `pr_suggestion` JSON so admin dashboard can review/copy).

## What gets built

### 1. Persistence
New migration: `sentry_issue_analyses`
- `id uuid pk`, `issue_id text unique`, `short_id text`, `title text`
- `root_cause jsonb`, `fix_plan jsonb`, `risk_score numeric`, `confidence numeric`, `category text`
- `pr_suggestion jsonb null`, `auto_pr_recommended bool`
- `status text` (`processed`|`failed`|`skipped`), `error text null`
- `trigger text` (`webhook`|`cron`|`manual`), `sentry_permalink text`
- `analyzed_at timestamptz`, `created_at`, `updated_at`
- Full GRANTs + RLS: admin/super_admin SELECT via `has_role`; service_role ALL. No anon.

### 2. Orchestrator (single entrypoint)
`src/lib/sre/pipeline/process-issue.server.ts`
- `processSentryIssue({ issueId, trigger, force? })`
- Dedup check → hydrate → `runAISRELoop` → upsert → PR draft generation
- Returns `{ status, analysisId, prSuggested }`

`src/lib/sre/pipeline/pr-draft.ts` (pure)
- Turns `AISREAnalysis` into a structured PR suggestion `{ title, branch, body, patches: [...] }`.
- No external calls; deterministic from analysis.

### 3. Webhook entrypoint
`src/routes/api/public/sentry.webhook.ts`
- POST only, `OPTIONS` for CORS.
- Verifies `sentry-hook-signature` (HMAC SHA256 of raw body using `SENTRY_WEBHOOK_SECRET`) with `timingSafeEqual`.
- Only handles `issue.created` / `issue.reopened` / `issue.assigned` resource actions.
- Extracts issue id, calls `processSentryIssue({ issueId, trigger: 'webhook' })`.
- Returns 200 quickly; failures logged but never 5xx to Sentry retry storm on validation errors.

Requires new secret: `SENTRY_WEBHOOK_SECRET` (via `add_secret`).

### 4. Cron backfill entrypoint
`src/routes/api/public/sentry.sync.ts`
- POST, authenticated with anon `apikey` header (pg_cron pattern).
- Calls existing `processSentryIssues({ limit: 25 })` list, then routes each through `processSentryIssue` (skips already-processed).
- pg_cron schedule (every 10 min) added via `supabase--insert`, targeting stable published URL.

### 5. Admin server functions + dashboard tab
- `listSentryAnalyses` (admin-gated via existing `assertGovernanceAdmin`) with composite cursor pagination + `total`.
- `getSentryAnalysis(issueId)` for detail drawer.
- `reprocessSentryIssue(issueId)` (admin) → calls orchestrator with `force: true`.
- CSV export via existing `toCsv` helper.
- New tab in `_authenticated.dashboard.admin.governance.tsx` → "AI SRE" with list, filters (status, trigger, category), detail view showing root cause / fix plan / PR suggestion, and "Reprocess" button.

### 6. Tests
- Unit: `pr-draft.test.ts` — deterministic output from fixture analysis.
- Unit: `process-issue.test.ts` — dedup logic, force flag, trigger tagging (mock SentryClient + supabase).
- Unit: `sentry-webhook-signature.test.ts` — valid, tampered, missing, wrong secret.

## Guardrails (matches user's rules)

- Webhook and cron both go through `processSentryIssue` — never call `runAISRELoop` or PR generator directly.
- PR draft creation is idempotent per `(issueId, analysis hash)`; re-runs don't create duplicates.
- No external GitHub API call in this pass — PR suggestion is a stored artifact for admin review. (GitHub push is a follow-up once the user connects a repo token.)
- All secrets read inside handlers, never at module scope.
- Admin-only reads; RLS enforced; service_role only inside server helpers.

## Files

New:
- `supabase/migrations/<ts>_sentry_issue_analyses.sql`
- `src/lib/sre/pipeline/process-issue.server.ts`
- `src/lib/sre/pipeline/pr-draft.ts`
- `src/lib/sre/pipeline/__tests__/pr-draft.test.ts`
- `src/lib/sre/pipeline/__tests__/process-issue.test.ts`
- `src/lib/sre/pipeline/__tests__/webhook-signature.test.ts`
- `src/lib/sre/sre.functions.ts` (list/get/reprocess/export server fns)
- `src/routes/api/public/sentry.webhook.ts`
- `src/routes/api/public/sentry.sync.ts`

Edited:
- `src/routes/_authenticated.dashboard.admin.governance.tsx` (new "AI SRE" tab)
- `src/integrations/supabase/types.ts` (regen for new table)

## After approval

I will (a) add `SENTRY_WEBHOOK_SECRET` via `add_secret`, (b) run the migration, (c) implement the files above in parallel batches, (d) schedule the cron via `supabase--insert` pointing at the stable published URL, (e) run the vitest suite, (f) tell you the Sentry webhook URL to paste into Sentry's Internal Integration settings.
