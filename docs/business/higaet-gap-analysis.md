# HIGAET Gap Analysis

Companion to `higaet-feature-inventory.md`. Ranks missing or partial work by launch impact. No code was written for this report.

---

## 1. Critical for launch

Must close before a public/paid launch. Each item is "partial or missing" in the inventory and blocks revenue, compliance, or core UX.

| # | Gap | Division | Why it blocks launch | Suggested scope |
|---|---|---|---|---|
| 1 | Payment checkout flow (academy fees, study-abroad service fees, tech invoices) | Academy, Hub, Tech | `payments`/`refunds`/`tech_invoices` tables exist but no end-user checkout route or provider integration | Wire Stripe/Paddle; checkout pages for enrollment, application service fee, invoice pay |
| 2 | Notification delivery (email/SMS) for auth, applications, invoices, tickets | Platform | Templates + logs tables exist but no verified provider hookup in production | Configure transactional email domain; wire templates to Resend; verify queue → delivery |
| 3 | Tech client portal completion (proposals, contracts, invoices UI) | Tech | Tables fully modeled; client-facing UI partial (~55-65%) | Build proposal accept, contract sign, invoice view + pay views under `_authenticated.dashboard.technologies.*` |
| 4 | Application document upload UX | Hub | `application_documents` table + RLS exist; needs polished applicant-facing uploader and counselor review queue | Storage bucket + signed-URL flow + status reviewer |
| 5 | Public API key self-service + scope UI | Platform | Admin views exist; developer-facing key issuance + docs sample-runner missing | Add key issuance UI under user account; document quotas |
| 6 | Backup + DR runbook | Platform | Not represented in routes/tables; required for paid customer data | Document RPO/RTO, schedule, restore drill |

## 2. High value after launch

Increases revenue or retention; not strictly blocking.

| # | Gap | Division | Value |
|---|---|---|---|
| 1 | Quizzes + auto-graded assessments | Academy | Required for certifications credibility |
| 2 | Live classes / video sessions (Zoom or LiveKit) | Academy | Differentiator for cohort-based programs |
| 3 | Per-lesson discussion threads | Academy | Engagement, completion-rate lift |
| 4 | Counselor analytics deep-dive (conversion funnels, SLA) | Hub | Sales-team performance management |
| 5 | Pre-departure & accommodation services | Hub | Margin-rich add-on |
| 6 | Tech project time-tracking + SLA dashboards | Tech | Required for T&M and dedicated-team contracts |
| 7 | RAG knowledge ingestion UI (drag-drop) for admins | Platform | Reduces AI ops cost |
| 8 | Notification preferences center for end users | Platform | Reduces opt-out + spam reports |
| 9 | Multilingual support (i18n) starting with Telugu/Hindi | All | Aligns with HIGAET regional reach |

## 3. Future roadmap

Strategic, defer until after first 6 months.

| # | Gap | Division |
|---|---|---|
| 1 | Mobile apps (React Native) for academy + counselor | Academy, Hub |
| 2 | Proctored online exams | Academy |
| 3 | Offline-first learning | Academy |
| 4 | Marketplace for third-party tutors / consultants | Academy, Hub |
| 5 | Partner / agent portal (commission tracking) | Hub |
| 6 | White-label tech client portals | Tech |
| 7 | AI agent marketplace + monetization | Platform |
| 8 | Data warehouse + BI dashboards (Metabase/Cube) | Platform |
| 9 | SOC 2 / ISO 27001 readiness program | Platform |

---

## Recommended next decision

Before any new build, confirm scope for "Critical for launch" items 1–6 above. Items 1 and 2 (payments + notifications) are the only ones that touch revenue and legal/compliance directly and should be sequenced first.
