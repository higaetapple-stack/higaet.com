# HIGAET Feature Inventory

Snapshot of what is shipped in the codebase as of this audit. No new code was written for this report; it is derived from the route tree (`src/routes/`), database tables, and existing infrastructure docs.

Legend: ✅ Fully implemented · 🟡 Partially implemented · 🟠 Planned (scaffolded only) · ❌ Missing

Completion % is a code-presence estimate (routes + tables + UI wired), not a QA verdict.

---

## 1. HIGAET Academy

| Feature | Status | % | Routes | Tables | Roles |
|---|---|---|---|---|---|
| Academy marketing site | ✅ | 95% | `academy.index`, `academy.programs.*`, `academy.campuses.*`, `academy.certifications`, `academy.online-courses`, `academy.offline-training`, `academy.corporate-training`, `academy.learning-paths`, `academy.internships`, `academy.placements`, `academy.scholarship`, `academy.success-stories`, `academy.admissions`, `academy.contact`, `academy.faq`, `academy.blog.*` | `programs`, `courses`, `universities` (shared) | public |
| Course catalog + detail | ✅ | 90% | `dashboard.courses.$courseId`, `academy.programs.*` | `courses`, `programs`, `course_faculty`, `lessons` | student, faculty, admin |
| Enrollments | ✅ | 85% | `dashboard.admin.enrollments` | `enrollments`, `progress` | student, admin |
| Assignments + submissions | ✅ | 80% | `dashboard.assignments.*`, `dashboard.faculty.submissions`, `dashboard.admin.assignments` | `assignments`, `submissions`, `project_submissions` | student, faculty, admin |
| Certificates + verification | ✅ | 85% | `dashboard.certificates.*`, `verify-certificate.$id`, `dashboard.admin.certificates` | `certificates`, `certificate_templates` | student, admin, public |
| Community + threads + events | ✅ | 80% | `community.*`, `community.events.*` | `communities`, `community_members`, `threads`, `replies`, `reactions`, `events`, `event_rsvps` | student, faculty, admin |
| Faculty workspace | 🟡 | 60% | `dashboard.faculty.submissions`, `faculty` | `course_faculty`, `submissions` | faculty |
| Live classes / video conferencing | ❌ | 0% | — | — | — |
| Quizzes / proctored exams | ❌ | 0% | — | — | — |
| Discussion forums per-lesson | 🟡 | 40% | community only | `threads`, `replies` | student |
| Mobile/offline learning | ❌ | 0% | — | — | — |

## 2. HIGAET Global Education Hub

| Feature | Status | % | Routes | Tables | Roles |
|---|---|---|---|---|---|
| Hub marketing site | ✅ | 95% | `global-education.index`, `.countries.*`, `.universities.*`, `.knowledge-base.universities.*`, `.scholarships`, `.student-services`, `.study-abroad`, `.visa-guidance`, `.admission-process`, `.faq`, `.contact` | `countries`, `universities`, `university_programs`, `scholarships` | public |
| Study-abroad lead capture | ✅ | 90% | `dashboard.admin.sa-leads`, `dashboard.admin.sa-applications` | `study_abroad_leads`, `applications`, `application_documents`, `application_status_history` | counselor, admin |
| Counselor workbench | ✅ | 90% | `dashboard.counselor.*` (leads, pipeline, tasks, follow-ups, workload, analytics, applications, visa, timeline) | `counselor_assignments`, `crm_tasks`, `crm_follow_ups`, `crm_notes`, `crm_activity_log` | counselor |
| Application workflow | ✅ | 80% | `dashboard.applications.*` | `applications`, `application_documents`, `application_status_history` | student, counselor, admin |
| Visa case management | ✅ | 80% | `dashboard.counselor.visa`, `dashboard.admin.visa.*` | `visa_cases`, `visa_documents`, `visa_status_history` | counselor, admin |
| Universities / programs catalog | ✅ | 85% | `dashboard.admin.universities`, `dashboard.admin.uniprograms`, `dashboard.admin.countries` | `universities`, `university_programs`, `countries` | admin |
| Scholarships | ✅ | 80% | `dashboard.admin.scholarships` | `scholarships` | admin |
| Payments for international fees | 🟡 | 50% | — | `payments`, `refunds` | admin |
| Document vault for applicants | 🟡 | 60% | embedded in applications | `application_documents` | student, counselor |
| Pre-departure / accommodation | ❌ | 0% | — | — | — |

## 3. HIGAET Technologies

| Feature | Status | % | Routes | Tables | Roles |
|---|---|---|---|---|---|
| Technologies marketing site | ✅ | 100% | `technologies.index`, `.expertise.*` (40+), `.industries.*` (15+), `.engagement.*` (6), service pages, `.case-studies.*`, `.insights.*`, `.careers`, `.contact` | — | public |
| Lead capture | ✅ | 90% | `dashboard.admin.tech-leads` | `technologies_leads` | admin |
| Client portal (tech_client) | 🟡 | 65% | `dashboard.technologies` family (per route-authorization) | `tech_clients`, `tech_client_requests`, `tech_request_attachments`, `tech_request_comments` | tech_client, admin |
| Projects + milestones | 🟡 | 60% | (admin views via dashboard.admin.projects) | `tech_projects`, `tech_project_members`, `tech_project_milestones`, `tech_project_documents` | tech_client, admin |
| Proposals + contracts | 🟡 | 55% | — | `tech_proposals`, `tech_proposal_versions`, `tech_contracts`, `tech_contract_documents` | admin |
| Invoicing + payments | 🟡 | 55% | — | `tech_invoices`, `tech_invoice_items`, `tech_payments`, `tech_payment_allocations` | admin |
| Support ticketing | ✅ | 75% | included in tech client portal | `tech_support_tickets`, `tech_ticket_comments`, `tech_ticket_attachments` | tech_client, admin |
| Public case studies / insights | ✅ | 90% | `technologies.case-studies.*`, `technologies.insights.*` | — | public |
| SLA dashboards / time tracking | ❌ | 0% | — | — | — |

## 4. Cross-cutting Platform

| Feature | Status | % | Routes | Tables |
|---|---|---|---|---|
| Auth + role gating | ✅ | 100% | `auth.*`, `_authenticated.*` | `profiles`, `user_roles`, `identity_providers`, `sso_domains`, `user_mfa_recovery_codes` |
| RLS policies + security audit | ✅ | 100% | — | all public tables |
| Launch Readiness pipeline + dashboard | ✅ | 100% | `dashboard.admin.launch-readiness`, `api/public/launch-readiness.ingest` | `launch_readiness_runs` |
| AI Gateway (chat, RAG, tutor, career, copilot) | ✅ | 85% | `ai.*`, `dashboard.ai.*`, `dashboard.admin.ai.*`, `assistant.*` | `ai_agent_configs`, `ai_collections`, `ai_documents`, `ai_chunks`, `ai_embeddings_queue`, `ai_conversations`, `ai_messages`, `ai_conversation_logs`, `ai_feedback`, `ai_usage`, `knowledge_sources` |
| Jobs / careers / placements | ✅ | 80% | `jobs.*`, `dashboard.career.*`, `dashboard.admin.jobs`, `.placements`, `.employers` | `job_postings`, `job_applications`, `saved_jobs`, `placements`, `employers` |
| CRM | ✅ | 80% | `dashboard.admin.crm.*` | `crm_tasks`, `crm_follow_ups`, `crm_notes`, `crm_activity_log` |
| Notifications | 🟡 | 65% | `dashboard.admin.notifications` | `notifications`, `notification_preferences`, `notification_templates`, `notification_delivery_logs` |
| Public API / webhooks / API keys | 🟡 | 70% | `dashboard.admin.api`, `dashboard.admin.webhooks`, `docs.api-reference`, `docs.webhooks` | `api_keys`, `api_key_scopes`, `api_scopes`, `api_key_usage`, `api_rate_limits`, `api_webhook_subscriptions`, `api_webhook_deliveries`, `webhook_events` |
| Observability + system health | ✅ | 80% | `dashboard.admin.observability`, `.provider-health`, `.system`, `status`, `system-dashboard` | `system_metrics`, `system_errors`, `security_events`, `audit_logs`, `domain_events` |
| Payments infra | 🟡 | 45% | — | `payments`, `refunds` |
| Content: blog / docs / case studies | ✅ | 85% | `blog.*`, `docs.*`, `careers.*`, `portfolio.*`, `success-stories` | — |
| Corporate / governance pages | ✅ | 90% | `about`, `about-higaet`, `leadership`, `founder`, `partners`, `advisors`, `governance`, `constitution*`, `kernel` | — |
| SEO infra (sitemap, robots) | ✅ | 100% | `sitemap.xml`, `robots.txt` | — |
