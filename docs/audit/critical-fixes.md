# HIGAET — Prioritized Fix List (Phase 11B — CLOSED)

_Date: 2026-06-22 · Status: **All P1 verified complete.** See `launch-readiness-final.md`._


Classification: **P0** launch blocker · **P1** before launch · **P2** post-launch · **P3** tech debt

## P0 — Launch blockers

_None identified at this audit pass._ Promote any P1 to P0 once a real launch date is set and the fix is not yet shipped.

## P1 — Must fix before public launch

| # | ID | Area | Action | Effort |
|---|---|---|---|---|
| 1 | S2a | DB security | Revoke `EXECUTE` from `anon`/`authenticated` on trigger-only SECURITY DEFINER functions (`tg_*`, `*_guard_*`, `audit_*`, `prevent_*`, `profiles_assign_portfolio_slug`, `update_updated_at_column`, `emit_domain_event`). Keep grants on user-callable ones. | S |
| 2 | S1 | Auth | Add AAL2 assurance check to admin destructive server fns (user role grants, key rotation, webhook deletion, content moderation). | M |
| 3 | AI1 | AI | Enforce server-side `collection_ids` allow-list per caller role before invoking `match_ai_chunks`. | S |
| 4 | API1 | API platform | Add per-API-key rate-limit middleware in `api-gateway.server.ts` (token bucket in `api_key_usage` or Redis-equivalent). | M |
| 5 | S5 | Webhooks | Add automated check (lint or test) that every `POST /api/public/*` handler verifies a signature/secret. | S |
| 6 | P1d | Perf | Synthetic load test: 50 RPS API + 100 concurrent RAG retrievals; capture p95s. | M |
| 7 | LR-DR | Ops | Verify point-in-time restore in a sandbox; document RPO/RTO. | M |
| 8 | LR-MAIL | Ops | SPF/DKIM/DMARC on sending domain; bounce/complaint handling. | S |

## P2 — Should fix soon after launch

| # | ID | Area | Action |
|---|---|---|---|
| 9 | S3 | DB | Move `vector`, `citext`, etc. out of `public` schema |
| 10 | S4 | DB | Add `SET search_path = public` to the one flagged function |
| 11 | P1a | DB | TTL/partition `domain_events`, `system_errors`, `system_metrics`, `notification_delivery_logs`, `api_webhook_deliveries` |
| 12 | P1b | DB | Add composite indexes per perf audit §1 |
| 13 | P1c | DB | Hourly rollup table for `api_key_usage` |
| 14 | A2 | Docs | Document canonical domain-event taxonomy |
| 15 | A3 | Obs | Propagate request-ID across server fns → `system_metrics` |
| 16 | A4 | AI | Feature-flag experimental agent runtime (`agent`, `kernel`, `governor`, `constitution`, `intent-router`, `memory-graph`, `multi-agent`) |

## P3 — Tech debt

| # | ID | Area | Action |
|---|---|---|---|
| 17 | A1 | AI | Consolidate `ai-tutor`/`ai-coach`/`ai-advisor`/`ai-copilot` into one persona-parameterized module |
| 18 | DOC | Docs | Single architecture overview in `docs/architecture.md` |
| 19 | TEST | QA | Add Playwright happy-path smoke tests for the 8 primary user journeys |

## Suggested Phase 11B execution order

1. S2a (1 migration, low risk, removes 47 lint warnings)
2. AI1 + API1 (touch one module each)
3. S1 (middleware addition, regression-test admin flows)
4. S5 (tooling)
5. Load test (P1d)
6. Ops items (LR-DR, LR-MAIL)

Each P1 is independently shippable. None should take more than a day.
