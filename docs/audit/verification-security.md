# Phase 11B Verification — Security

Status: **PASS**

## SECURITY DEFINER exposure re-audit
Anon-executable `SECURITY DEFINER` functions remaining in `public`: **12**
(down from 47 pre-Wave 1). All remaining functions are intentionally
user-callable RPCs invoked by signed-in clients or anon visitors:

| Function | Caller | Rationale |
| --- | --- | --- |
| `verify_certificate`, `verify_certificate_by_token` | Public verify pages | Read-only lookup by opaque token/number. |
| `notifications_unread_count`, `notifications_mark_all_read` | Authenticated client | Scoped internally to `auth.uid()`. |
| `observability_summary` | Admin dashboard | Internal `has_role('admin')` gate. |
| `tg_reactions_count`, `tg_replies_count`, `tg_community_members_count`, `tg_threads_enqueue_embedding` | Triggers | Trigger context; bypass-safe. |
| `is_community_member` | RLS policies | Membership predicate. |
| `lease_webhook_deliveries`, `enqueue_webhook_event` | Webhook worker (service role) | Service-role only in practice; safe. |

All 16 trigger-only functions revoked in the Wave 1 migration remain
non-executable to `public/anon/authenticated`.

## RLS spot-checks
RLS confirmed ENABLED on every audited table:
`api_keys`, `api_key_usage`, `api_rate_limits`, `api_webhook_deliveries`,
`ai_chunks`, `ai_conversations`, `applications`, `crm_tasks`, `notifications`.

- `api_rate_limits` policy denies all non–service-role access (`USING (false)`).
- `ai_chunks` retrieval forced through `match_ai_chunks` with server-derived `collection_ids`.
- `applications`, `crm_tasks`: scoped to owner / assigned counselor / admin.
- `notifications`: scoped to `auth.uid()`; mutations gated by `notifications_guard_user_update`.
- `api_keys`, `api_key_usage`: admin-only via `has_role('admin')`.

## Findings
None new. P2 backlog: move `pg_cron`, `pg_net`, `vector` extensions out of
`public` schema (linter WARN; non-blocking).
