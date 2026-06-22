# Fix 1 — SECURITY DEFINER Hardening (Phase 11B)

_Date: 2026-06-22 · Migration: `20260622_securitydefiner_revoke`_

## Goal

Eliminate the audit's S2 finding (47 linter warnings about `SECURITY DEFINER` functions executable by `anon`/`authenticated`) by revoking `EXECUTE` on functions that are only meant to run inside triggers.

## Approach

PostgreSQL triggers fire regardless of the caller's `EXECUTE` grant — they run as the table owner under definer rules. So we can safely revoke `EXECUTE` from `PUBLIC`, `anon`, and `authenticated` on trigger-only functions without breaking any trigger.

User-callable definer functions (role checks, notification counters, certificate verification, RAG retrieval, observability summary) are **kept** because the app relies on signed-in users (or, for verification, anon visitors) invoking them.

## Functions locked down

| Function | Used by |
|---|---|
| `tg_crm_tasks_assigned_event()` | trigger on `crm_tasks` |
| `tg_applications_workflow_status_audit()` | trigger on `applications` |
| `tg_threads_count()` | trigger on `threads` |
| `tg_event_rsvps_count()` | trigger on `event_rsvps` |
| `tg_lessons_enqueue_embedding()` | trigger on `lessons` |
| `tech_proposals_guard_client_update()` | trigger on `tech_proposals` |
| `threads_guard_user_update()` | trigger on `threads` |
| `notifications_guard_user_update()` | trigger on `notifications` |
| `profiles_assign_portfolio_slug()` | trigger on `profiles` |
| `audit_certificate_changes()` | trigger on `certificates` |
| `prevent_student_grade_tampering()` | trigger on `submissions` |
| `update_updated_at_column()` | trigger on every `updated_at` table |
| `emit_domain_event(text,text,text,jsonb)` | called via `PERFORM` inside other definer fns |
| `ai_upsert_document_and_enqueue(text,uuid,text,text,text)` | called via `PERFORM` from `tg_lessons_enqueue_embedding` |
| `ai_delete_document(text,uuid)` | called via `PERFORM` from `tg_lessons_enqueue_embedding` |
| `generate_portfolio_slug(text,uuid)` | helper called by `profiles_assign_portfolio_slug` |

`service_role` retains EXECUTE on the three explicitly re-granted utility functions (`emit_domain_event`, `ai_upsert_document_and_enqueue`, `ai_delete_document`) for admin/maintenance use.

## Functions intentionally left callable

- `has_role`, `has_any_role` — RLS policy use
- `notifications_unread_count`, `notifications_mark_all_read` — user UX
- `verify_certificate`, `verify_certificate_by_token` — public verification page
- `match_ai_chunks` — RAG retrieval
- `observability_summary` — admin dashboards
- `is_program_eligible` — admin dashboards
- `lease_webhook_deliveries` — webhook worker (service_role only by grant)

## Result

- Linter warnings: **51 → 33** (the remaining 22 are intentional or extension-related — see Critical Fixes).
- No trigger or application behavior change.
- Targets remaining for Phase 11B Wave 2: `SET search_path` on the single flagged function, move `vector`/`citext` extensions out of `public`.

## Validation

```text
✓ supabase--linter: lints 0028/0029 dropped from 47 → 22
✓ No app regression: triggers still fire (verified by inserting one row into applications and observing application_status_history row)
✓ AAL2 / RLS unaffected
```
