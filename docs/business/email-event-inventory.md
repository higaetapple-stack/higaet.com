# HIGAET Email Event Inventory

Audit only. No sending code is written from this document — it lists every
business event in the codebase that should trigger a transactional email once
`notify.higaet.com` is verified and Lovable Emails is wired in.

Sender plan (assumed, not yet configured):

- From: `HIGAET <notifications@higaet.com>`
- Reply-To: `support@higaet.com`
- Sending domain: `notify.higaet.com`

Priority: **P0** = launch blocker, **P1** = important, **P2** = nice-to-have.

---

## 1. Authentication

| Event | Source of truth | Priority | Notes |
| --- | --- | --- | --- |
| User registration / welcome | `supabase.auth.signUp` (auto via Supabase) | P0 | Branded welcome should follow the platform's confirm-email message. |
| Email verification | Supabase Auth hook | P0 | Auth template, not app template. |
| Password reset | `supabase.auth.resetPasswordForEmail` | P0 | Auth template. |
| Email change confirmation | `supabase.auth.updateUser({ email })` | P1 | Auth template. |
| Magic-link sign-in | Supabase Auth (currently unused) | P2 | Only if magic links are enabled later. |
| Re-authentication | Supabase Auth | P2 | Same. |

All six map directly to the auth templates that `scaffold_auth_email_templates`
produces. No app-side trigger code needed.

---

## 2. Payments (manual verification system)

| Event | Trigger location | Priority | Recipient |
| --- | --- | --- | --- |
| Payment submitted | `submitManualPayment` (`src/lib/manual-payments.functions.ts`) | P0 | Payer |
| Payment approved | `adminApprovePayment` | P0 | Payer |
| Payment rejected | `adminRejectPayment` | P0 | Payer |
| More information required | `adminRequestPaymentInfo` | P0 | Payer |

All four already write an in-app notification through the local `notify()`
helper. The same call sites are the exact future hook for email enqueue.

---

## 3. HIGAET Academy

| Event | Trigger location | Priority | Recipient |
| --- | --- | --- | --- |
| Enrollment confirmation | `src/lib/learn.functions.ts` (enrollment insert) and `activateForPayment` (manual-payments) | P0 | Student |
| Course/program completion | `src/lib/learn.functions.ts` (progress 100%) | P1 | Student |
| Certificate issued | certificate insert in `learn.functions.ts` / certificates flow | P0 | Student |
| Assignment / submission feedback | `src/lib/learn.functions.ts` (assignment grading) | P2 | Student |
| New lesson reply / thread reply | `src/lib/community/*` (replies tables) | P2 | Thread author |

---

## 4. Global Education Hub

| Event | Trigger location | Priority | Recipient |
| --- | --- | --- | --- |
| Application submitted | `src/lib/study-abroad.functions.ts` (applications insert) | P0 | Applicant |
| Application status changed | applications update; logged via `application_status_history` | P0 | Applicant |
| Application document requested | `application_documents` insert | P1 | Applicant |
| Counselor assigned | `src/lib/study-abroad.functions.ts` (`counselor_assignments` insert) | P1 | Applicant + counselor |
| Visa case created | `src/lib/visa.functions.ts` | P1 | Applicant |
| Visa status updated | `src/lib/visa.functions.ts` (`visa_status_history`) | P0 | Applicant |
| Scholarship awarded | scholarships flow | P2 | Applicant |

---

## 5. HIGAET Technologies

| Event | Trigger location | Priority | Recipient |
| --- | --- | --- | --- |
| New client request received | `src/lib/tech-commercial.functions.ts` (`tech_client_requests` insert) | P0 | Internal sales + client |
| Proposal created | `src/lib/tech-commercial.functions.ts` (`tech_proposals` insert) | P0 | Client |
| Proposal accepted / rejected | `tech_proposals` status update | P0 | Internal sales |
| Contract generated | `tech_contracts` insert | P0 | Client signer |
| Contract signed | `tech_contracts` status update | P0 | Internal + client |
| Invoice generated | `src/lib/tech-finance.functions.ts` (`tech_invoices` insert) | P0 | Client billing contact |
| Payment received / invoice settled | `activateForPayment` in manual-payments (`tech_invoices` update) | P0 | Client + internal finance |
| Project milestone updated | `tech_project_milestones` update | P1 | Project members |
| Support ticket created | `src/lib/tech-support.functions.ts` (`tech_support_tickets` insert) | P0 | Assignee + reporter |
| Support ticket updated | `tech_support_tickets` update / comments | P0 | Reporter |
| Ticket SLA breach warning | future cron | P1 | Assignee + manager |

---

## 6. Platform / Cross-cutting

| Event | Source | Priority | Recipient |
| --- | --- | --- | --- |
| Admin invitation | `src/lib/admin/*` (user_roles insert with role=admin) | P1 | Invitee |
| Role grant / revoke | `user_roles` insert/delete | P1 | User |
| MFA enrolled / recovery codes regenerated | `src/components/security/MfaCard.tsx` | P2 | Self (security trail) |
| New session from new device | security_events | P2 | User |
| Critical system alert (launch-readiness fail) | `scripts/notify-failure.mjs` | P0 | Ops list (already Slack-capable) |
| Weekly digest | future | P2 | All users opted-in |

---

## Coverage summary

| Bucket | Distinct events | P0 count |
| --- | --- | --- |
| Auth | 6 | 3 |
| Payments | 4 | 4 |
| Academy | 5 | 2 |
| Education Hub | 7 | 3 |
| Technologies | 11 | 8 |
| Platform | 6 | 1 |
| **Total** | **39** | **21** |

The 21 P0 events form the minimum set the implementation phase must wire to
Lovable Emails templates before public launch.
