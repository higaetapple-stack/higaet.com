# HIGAET Email Infrastructure Audit

What's already in the codebase, what's missing, and what to reuse when the
sender domain (`notify.higaet.com`) is verified and Lovable Emails is wired in.

---

## 1. Existing tables (Supabase)

| Table | Status | Purpose | Reuse plan |
| --- | --- | --- | --- |
| `notifications` | ✅ Present, RLS on | Per-user in-app notification feed (read by `NotificationBell`). | Keep as the in-app surface. Each email send produces one row here and one queue enqueue. |
| `notification_templates` | ✅ Present, RLS on | Body/subject templates with `category`. | Reuse as the canonical template registry; map each row to a React Email template name. |
| `notification_preferences` | ✅ Present | Per-user opt-in matrix by `category`. | Reuse as the *only* preference gate — both in-app and email must consult it. |
| `notification_delivery_logs` | ✅ Present | Per-attempt log (status, error). | Reuse for app-side observability. Lovable Emails' `email_send_log` is the system-of-record for SMTP delivery; mirror its outcome into this table for cross-channel reporting. |

No schema changes required for the email implementation phase.

---

## 2. Existing application code

| File | Status | Notes |
| --- | --- | --- |
| `src/lib/notifications/service.server.ts` | ✅ Present | Server helper that resolves template + preferences and writes both `notifications` and `notification_delivery_logs`. Uses `supabaseAdmin`. The future email enqueue hook attaches here. |
| `src/lib/notifications/types.ts` | ✅ Present | Channel + category enums. Already includes an `email` channel constant — currently unused. |
| `src/lib/notifications.functions.ts` | ✅ Present | User-facing server fns: fetch feed, mark read, manage prefs, admin template CRUD. |
| `src/components/notifications/NotificationBell.tsx` | ✅ Present | In-app bell UI; will keep working unchanged. |
| `src/lib/manual-payments.functions.ts` | ✅ Wired (in-app only) | Four `notify(...)` call sites — the canonical pattern other domains should adopt. |
| `src/lib/system-health.functions.ts` | ✅ Present | Already reads `notification_delivery_logs` for the launch-readiness dashboard. |

---

## 3. Provider / SMTP scan

| Search | Result |
| --- | --- |
| `resend`, `nodemailer`, `smtp`, `sendgrid`, `mailgun`, `postmark` in `src/` | **None.** No legacy email provider to migrate or rip out. |
| Edge functions sending email | None present. |
| Outbound SMTP env vars | None set. |
| Lovable Emails queue (`email_send_log`, `email_send_state`, `suppressed_emails`, `email_unsubscribe_tokens`, pgmq queues) | **Not provisioned yet** — `setup_email_infra` has never run. |
| Sender domain | **Not configured** — `check_email_domain_status` returned "not_started". |

Clean slate. No duplication risk.

---

## 4. What is missing (to be created in the implementation phase, not now)

1. Sender domain `notify.higaet.com` recorded in Lovable (NS-delegated).
2. Lovable Emails infrastructure (`setup_email_infra`): pgmq queues, RPC
   wrappers, `email_send_log`, `email_send_state`, `suppressed_emails`,
   `email_unsubscribe_tokens`, cron job for `/lovable/email/queue/process`.
3. Auth templates via `scaffold_auth_email_templates` (6 templates).
4. App-email scaffold via `scaffold_transactional_email`, then one React Email
   template per row in the `email-integration-map.md` template column.
5. A thin client helper (`src/lib/email/send.ts`) that POSTs to the scaffolded
   send route and is called from the `notify(...)` helper alongside the
   in-app insert.
6. Branded unsubscribe page (path chosen by the scaffold tool).
7. Launch-readiness check: provider health (`email_send_state` reachable,
   pgmq queue depth, dlq count) and a recent successful send within 24h.

---

## 5. What to explicitly NOT do

- Do not add `resend`, `nodemailer`, or any SMTP SDK — Lovable Emails handles
  the provider relationship.
- Do not create new notification tables. Reuse the four above.
- Do not bypass `notification_preferences`. Both channels gate on the same
  matrix.
- Do not move the in-app insert out of `notify()`. The email enqueue should be
  a second statement inside the same helper so every existing call site
  benefits without code churn.
- Do not touch cPanel MX/SPF/DKIM/DMARC for the root domain — Lovable
  delegation is a subdomain only.

---

## 6. Reuse decision summary

| Concern | Reuse / New |
| --- | --- |
| Template storage | Reuse `notification_templates` for category/copy metadata; React Email files own the rendered HTML. |
| User preferences | Reuse `notification_preferences` (single source of truth). |
| Per-user feed | Reuse `notifications`. |
| Delivery log (app side) | Reuse `notification_delivery_logs`. |
| Delivery log (SMTP side) | New, created by `setup_email_infra` (`email_send_log`). |
| Queue / retry / DLQ | New, created by `setup_email_infra`. |
| Suppression / unsubscribe | New, created by `setup_email_infra`. |
| Provider abstraction | Not needed — Lovable Emails is the provider. If a second provider is ever required, add it behind the existing `notify()` helper, not in a parallel system. |

The implementation phase will be net additive: one helper edit, one set of
template files, one launch-readiness check. No existing notification surface
needs to be replaced.
