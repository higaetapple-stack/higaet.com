# HIGAET Email Integration Map

For each business event in `email-event-inventory.md`, this map lists the
**exact file + function** in the current codebase that will need a single line
added to enqueue an email once the domain is verified. No code is changed here;
this is the wiring plan.

Convention used in the "Hook" column:

- `notify+` = the existing in-app `notify(...)` call already fires here; add
  an email enqueue alongside it.
- `add` = no notification call exists today; both in-app and email need to be
  added at the same point.
- `auth` = handled by `scaffold_auth_email_templates`; no app code change.

---

## Authentication

| Event | File | Function / location | Template (proposed) | Hook |
| --- | --- | --- | --- | --- |
| Welcome / confirm email | (Supabase Auth) | signup hook | `auth/signup` | auth |
| Password reset | (Supabase Auth) | recovery hook | `auth/recovery` | auth |
| Email change | (Supabase Auth) | email-change hook | `auth/email-change` | auth |
| Magic link | (Supabase Auth) | magic-link hook | `auth/magic-link` | auth |
| Re-auth | (Supabase Auth) | reauthentication hook | `auth/reauthentication` | auth |
| Invite | (Supabase Auth) | invite hook | `auth/invite` | auth |

---

## Payments

| Event | File | Function | Template | Hook |
| --- | --- | --- | --- | --- |
| Submitted | `src/lib/manual-payments.functions.ts` | `submitManualPayment` (line ~62) | `payment/submitted` | notify+ |
| Approved | `src/lib/manual-payments.functions.ts` | `adminApprovePayment` (line ~247) | `payment/approved` | notify+ |
| Rejected | `src/lib/manual-payments.functions.ts` | `adminRejectPayment` (line ~289) | `payment/rejected` | notify+ |
| Info requested | `src/lib/manual-payments.functions.ts` | `adminRequestPaymentInfo` (line ~322) | `payment/info-requested` | notify+ |

---

## Academy

| Event | File | Function | Template | Hook |
| --- | --- | --- | --- | --- |
| Enrollment confirmation (manual-pay path) | `src/lib/manual-payments.functions.ts` | `activateForPayment` (course/program branch) | `academy/enrollment-confirmed` | add |
| Enrollment confirmation (direct enroll) | `src/lib/learn.functions.ts` | enrollment insert path | `academy/enrollment-confirmed` | add |
| Course completion | `src/lib/learn.functions.ts` | progress update where 100% reached | `academy/course-completed` | add |
| Certificate issued | `src/lib/learn.functions.ts` | certificates insert | `academy/certificate-issued` | add |
| Assignment feedback | `src/lib/learn.functions.ts` | submission grading update | `academy/assignment-feedback` | add |

---

## Global Education Hub

| Event | File | Function | Template | Hook |
| --- | --- | --- | --- | --- |
| Application submitted | `src/lib/study-abroad.functions.ts` | applications insert | `hub/application-submitted` | add |
| Application status changed | `src/lib/study-abroad.functions.ts` | applications update (and `application_status_history` insert) | `hub/application-status-changed` | add |
| Document requested | `src/lib/study-abroad.functions.ts` | `application_documents` insert | `hub/document-requested` | add |
| Counselor assigned | `src/lib/study-abroad.functions.ts` | `counselor_assignments` insert | `hub/counselor-assigned` | add |
| Visa case created | `src/lib/visa.functions.ts` | `visa_cases` insert | `hub/visa-case-created` | add |
| Visa status updated | `src/lib/visa.functions.ts` | `visa_cases` update / `visa_status_history` insert | `hub/visa-status-updated` | add |

---

## Technologies

| Event | File | Function | Template | Hook |
| --- | --- | --- | --- | --- |
| Client request created | `src/lib/tech-commercial.functions.ts` | `tech_client_requests` insert | `tech/request-received` | add |
| Proposal created | `src/lib/tech-commercial.functions.ts` | `tech_proposals` insert | `tech/proposal-created` | add |
| Proposal accepted/rejected | `src/lib/tech-commercial.functions.ts` | `tech_proposals` status update | `tech/proposal-decision` | add |
| Contract generated | `src/lib/tech-commercial.functions.ts` | `tech_contracts` insert | `tech/contract-generated` | add |
| Contract signed | `src/lib/tech-commercial.functions.ts` | `tech_contracts` update (signed) | `tech/contract-signed` | add |
| Invoice generated | `src/lib/tech-finance.functions.ts` | `tech_invoices` insert | `tech/invoice-generated` | add |
| Payment received / invoice settled | `src/lib/manual-payments.functions.ts` | `activateForPayment` (invoice branch) | `tech/invoice-paid` | notify+ |
| Project milestone updated | `src/lib/tech-projects.functions.ts` (if present) | milestone update | `tech/milestone-updated` | add |
| Support ticket created | `src/lib/tech-support.functions.ts` | `tech_support_tickets` insert | `tech/ticket-created` | add |
| Support ticket updated | `src/lib/tech-support.functions.ts` | `tech_support_tickets` update / comment insert | `tech/ticket-updated` | add |

---

## Platform

| Event | File | Function | Template | Hook |
| --- | --- | --- | --- | --- |
| Admin invite | `src/lib/admin/*.functions.ts` | `user_roles` insert (role=admin) | `platform/admin-invite` | add |
| Role grant/revoke | `src/lib/admin/*.functions.ts` | `user_roles` insert/delete | `platform/role-change` | add |
| Launch-readiness failure | `scripts/notify-failure.mjs` | top-level | `platform/system-alert` | add (currently Slack-only) |
| Critical security event | `src/lib/security.functions.ts` (if present) / security_events writers | insert | `platform/security-alert` | add |

---

## Recommended template-naming convention

`{division}/{event-slug}` — keeps the registry browsable and matches the
proposed folder layout under `src/lib/email-templates/`.

## Recipient resolution

All `notify+` hooks already have `user_id`; the email implementation phase will
join `auth.users.email` via `supabaseAdmin` (server-only). All `add` hooks
already have a `user_id`, an explicit recipient column (e.g. `tech_invoices.client_id`),
or a join path to one — none require schema changes.
