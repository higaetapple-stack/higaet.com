# HIGAET — Security Audit (Phase 11A)

_Date: 2026-06-22 · Mode: read-only_

## 1. Headline findings

| ID | Finding | Severity | Source |
|---|---|---|---|
| S1 | Auth/AAL2 not enforced on admin server fns (role check present, MFA assurance level not checked) | **P1** | Code review |
| S2 | 22 `SECURITY DEFINER` functions executable by `anon`; 25 by `authenticated` | **P1** | supabase--linter (lints 0028/0029) |
| S3 | 3 extensions installed in `public` schema (vector, citext, pgcrypto-style) | P2 | supabase--linter (0014) |
| S4 | 1 function missing `SET search_path` | P2 | supabase--linter (0011) |
| S5 | No automated check that every `POST /api/public/*` route validates a signature | P1 | Manual: webhook routes verified, but pattern not enforced |
| S6 | RLS coverage: all 90 public tables have policies declared (per supabase-tables count). Spot-checks pass (`user_roles`, `applications`, `notifications`). | OK | tables snapshot |
| S7 | `has_role`/`has_any_role` are SECURITY DEFINER on `public.user_roles` — correct pattern, no recursion risk | OK | db functions |
| S8 | API key scopes table (`api_key_scopes`/`api_scopes`) present and joined in `api-gateway.server.ts` | OK | code |

## 2. RLS spot-check matrix

| Table | Policies | auth.uid() scoped | Admin bypass via `has_role` | Verdict |
|---|---|---|---|---|
| `applications` | 4 | yes | yes | ✓ |
| `application_status_history` | 3 | student-own, staff-all | yes | ✓ |
| `notifications` | 2 | user_id = auth.uid() | yes | ✓ |
| `user_roles` | 2 | read self, admin all | yes | ✓ — anon NOT granted |
| `ai_conversations` / `ai_messages` | 4 / 3 | owner-scoped | yes | ✓ |
| `api_keys` | 1 | owner-scoped | yes | ✓ |
| `webhook_events` / `api_webhook_deliveries` | 1 each | service-role only | n/a | ✓ |
| `domain_events` | 1 | admin-only read | yes | ✓ |
| `certificates` | 2 | student-own + admin | yes | ✓ |
| `tech_*` (client portal) | guarded by `tech_proposals_guard_client_update` etc. | yes | yes | ✓ |

No table with RLS disabled detected by linter.

## 3. SECURITY DEFINER exposure (S2 detail)

47 of the 51 linter warnings are about `SECURITY DEFINER` functions executable by `anon` or `authenticated`. Most are **intentional and required**:

- `has_role`, `has_any_role` — used inside RLS, MUST be invokable.
- `notifications_unread_count`, `notifications_mark_all_read` — user-scoped, safe.
- `verify_certificate`, `verify_certificate_by_token` — public verification endpoint, intentional.
- `match_ai_chunks` — called by RAG retrieval as authenticated.
- `emit_domain_event` — called by triggers (definer required).
- Trigger functions (`tg_*`, `*_guard_*`, `audit_*`) — only invoked by triggers; `EXECUTE` to anon is harmless because they require trigger context (no row passed → noop or error).

**Action (P1):** revoke `EXECUTE` from `anon` and `authenticated` on **trigger-only** functions to silence the lint and reduce attack surface. Keep grants on the user-callable ones (`has_role`, `notifications_*`, `verify_certificate*`, `match_ai_chunks`, `observability_summary`, `is_program_eligible`).

## 4. AI / prompt-injection

- All RAG retrieval scopes by `collection_ids` (caller-supplied) — **risk:** a user could ask for collections they shouldn't read. Verify caller-allowed collections server-side in `ai-knowledge.functions.ts`.
- Conversation isolation: `ai_messages` RLS scopes by `conversation_id` owner — OK.
- No system-prompt redaction in `ai_conversation_logs` — admin can read raw prompts. Acceptable but document it.

## 5. Webhook / API platform

- `api_webhook_deliveries.lease_webhook_deliveries` uses `FOR UPDATE SKIP LOCKED` — correct, no double-dispatch.
- HMAC signature verification: confirmed in `webhook-dispatch.server.ts`. Inbound webhooks under `/api/public/*` should follow the same pattern — audit every file before launch.
- Rate limiting: not visible in `api-gateway.server.ts`. **P1** before public launch.

## 6. Prioritized fixes

| ID | Action | Priority |
|---|---|---|
| S2a | Revoke EXECUTE from anon/authenticated on trigger-only SECURITY DEFINER fns | P1 |
| S1 | Add AAL2 check (`auth.jwt() ->> 'aal' = 'aal2'`) gate for admin destructive server fns | P1 |
| S5 | Add signature-required lint/test for `src/routes/api/public/*` POST handlers | P1 |
| AI1 | Server-side allow-list of `collection_ids` per user role in `match_ai_chunks` callers | P1 |
| API1 | Add per-key rate limiting middleware in `api-gateway.server.ts` | P1 |
| S3 | Move `vector`, `citext` extensions out of `public` schema | P2 (cosmetic, breaks migrations if done late) |
| S4 | Add `SET search_path = public` to the single flagged function | P2 |
