# HIGAET Complete Supabase Dependency Audit

Audit-only. No code changes. No deployment. No migration.

Inventory measured by grep across `src/` and `supabase/migrations/` on the current HEAD.

---

## Deliverable 1 — Auth Dependency Inventory

### Headline counts
- 71 files import `@/integrations/supabase/*` or `@supabase/supabase-js`
- 36 server functions use `.middleware([requireSupabaseAuth])`
- 22 files call `supabase.auth.*` directly
- 1 file uses Lovable broker (`@/integrations/lovable`) for Google OAuth

### Critical auth integration files (Hard — replace wholesale)
| File | Role | Replace with |
|---|---|---|
| `src/integrations/supabase/client.ts` | Browser client + session storage | Auth.js / Lucia browser client |
| `src/integrations/supabase/auth-middleware.ts` | `requireSupabaseAuth` server middleware | Auth.js `auth()` middleware |
| `src/integrations/supabase/auth-attacher.ts` | `attachSupabaseAuth` bearer attacher in `src/start.ts` | Cookie session (no bearer needed) |
| `src/integrations/supabase/client.server.ts` | `supabaseAdmin` service-role client | PG pool + `auth.admin.*` shim |
| `src/integrations/lovable/index.ts` | Google OAuth broker (iframe-safe) | Auth.js Google provider |
| `src/lib/server/require-auth-http.ts` | HTTP-level auth guard for `/api/*` | New JWT/cookie guard |

### Auth surface in pages/components (Medium — swap client API)
- `src/routes/auth.login.tsx` — `supabase.auth.signInWithPassword`, `lovable.auth.signInWithOAuth('google')`
- `src/routes/auth.register.tsx` — `supabase.auth.signUp`, Google OAuth
- `src/routes/auth.forgot-password.tsx` — `resetPasswordForEmail`
- `src/routes/_authenticated.tsx` — `supabase.auth.getUser()` route gate
- `src/routes/__root.tsx` — `onAuthStateChange` listener
- `src/routes/ai.chat.tsx`, `ai.history.tsx`, `jobs.$slug.tsx`, `global-education.universities.$slug.tsx` — `getSession()` for conditional UI
- `src/components/dashboard/DashboardHeader.tsx` — `signOut`
- `src/components/security/SessionsCard.tsx` — list/revoke sessions
- `src/components/security/MfaCard.tsx` — 6 calls: `mfa.enroll/challenge/verify/unenroll/listFactors` (Hard — Supabase MFA API)
- `src/components/notifications/NotificationBell.tsx`, `ChatWindow.tsx` — `getSession()` for bearer

### Protected server functions (36 files, all `*.functions.ts`)
admin, ai-advisor, ai-chat, ai-coach, ai-copilot, ai-hub, ai-knowledge, ai-tutor, ai/internal, api-keys, academic, career, career-admin, certificates, community, counselor, crm, education-hub, leads, learn, notifications, observability, placements, portfolio, rag-observability, security, stories, study-abroad, system-health, tech-commercial, tech-finance, tech-pdf-server consumers, tech-support, technologies, visa. Plus API routes: `src/routes/api/chat.ts`, `src/routes/api/public/self-optimize.ts`, `src/routes/api/public/constitution.apply.ts`.

**Migration complexity:** Critical. Every `.middleware([requireSupabaseAuth])` returns `{ supabase, userId, claims }` from a JWT. Replacement must inject equivalent context (signed-in PG client + `userId` + role claims) into all 36 files without touching handler bodies.

### Auth admin usage
- `src/lib/security.functions.ts` — `supabase.auth.admin.signOut`, `getUserById`, recovery code generation
- `src/lib/admin.functions.ts` (likely; uses `supabaseAdmin`) — user provisioning

---

## Deliverable 2 — Database Dependency Inventory

### Scale
- **93 tables** in `public`, **44 migrations** in `supabase/migrations/`
- ~180 RLS policies; all routed through `public.has_role(uid, role)` / `has_any_role`
- 4 enabled extensions: `pgvector`, `pg_cron`, `pgcrypto`, `citext`

### Critical table clusters
| Cluster | Tables | Bound to |
|---|---|---|
| **Identity** | `profiles`, `user_roles`, `user_mfa_recovery_codes`, `identity_providers`, `sso_domains` | `auth.users(id)` FK — ~30 onward FKs in `applications`, `enrollments`, `progress`, `submissions`, `notifications`, `payments`, `community_members`, `crm_*`, etc. **Critical** |
| **Payments** | `payments`, `refunds`, `tech_invoices`, `tech_invoice_items`, `tech_payments`, `tech_payment_allocations` | Stripe/Paddle webhooks, `audit_logs` |
| **AI/RAG** | `ai_documents`, `ai_chunks` (vector(1536)), `ai_collections`, `ai_embeddings_queue`, `ai_conversations`, `ai_messages`, `ai_conversation_logs`, `ai_agent_configs`, `ai_feedback`, `knowledge_sources` | `pgvector` + `match_ai_chunks()` IVFFLAT/HNSW |
| **LMS** | `programs`, `courses`, `lessons`, `assignments`, `submissions`, `enrollments`, `progress`, `certificates`, `certificate_templates` | Storage bucket `certificates`, `pg_cron` embeddings |
| **CRM/Apps** | `applications`, `application_documents`, `application_status_history`, `counselor_assignments`, `visa_cases`, `crm_tasks`, `crm_notes`, `crm_follow_ups`, `crm_activity_log` | `tg_applications_workflow_status_audit` trigger emits `domain_events` |
| **Events bus** | `domain_events`, `webhook_events`, `api_webhook_subscriptions`, `api_webhook_deliveries`, `notification_*` | `lease_webhook_deliveries()` SKIP LOCKED queue, cron |
| **Observability** | `system_errors`, `system_metrics`, `security_events`, `audit_logs` | `observability_summary()` SECURITY DEFINER |
| **Community** | `communities`, `threads`, `replies`, `reactions`, `events`, `event_rsvps` | trigger counters |
| **API** | `api_keys`, `api_scopes`, `api_key_scopes`, `api_key_usage`, `api_rate_limits` | `check_api_rate_limit()` |

### DB functions / triggers (must port verbatim)
- Security-definer: `has_role`, `has_any_role`, `verify_certificate`, `verify_certificate_by_token`, `is_program_eligible`, `match_ai_chunks`, `observability_summary`, `emit_domain_event`, `lease_webhook_deliveries`, `check_api_rate_limit`, `ai_delete_document`, `ai_upsert_document_and_enqueue`, `notifications_unread_count`, `notifications_mark_all_read`, `generate_portfolio_slug`, `cleanup_api_rate_limits`
- Triggers: `tg_applications_workflow_status_audit`, `tg_lessons_enqueue_embedding`, `tg_crm_tasks_assigned_event`, `tg_threads_count`, `tg_replies_count`, `tg_reactions_count`, `tg_event_rsvps_count`, `audit_certificate_changes`, `prevent_student_grade_tampering`, `notifications_guard_user_update`, `threads_guard_user_update`, `profiles_assign_portfolio_slug`, `update_updated_at_column`

### `auth.users` FK fanout (must rewrite under self-managed auth)
~30 tables reference `auth.users(id)`: `profiles`, `user_roles`, `user_mfa_recovery_codes`, `enrollments`, `progress`, `submissions`, `assignments` (graded_by), `certificates` (student_id), `notifications`, `notification_preferences`, `notification_delivery_logs`, `community_members`, `threads`, `replies`, `reactions`, `event_rsvps`, `applications`, `application_documents`, `counselor_assignments`, `visa_cases`, `crm_tasks` (assigned_to/created_by), `crm_notes`, `crm_follow_ups`, `crm_activity_log`, `audit_logs` (actor_id), `domain_events` (actor_id), `security_events`, `api_keys`, `ai_conversations`, `ai_feedback`. **Critical.**

### `pg_cron` jobs
- AI embeddings drain → calls `/api/public/cron/embeddings`
- `cleanup_api_rate_limits`
- Webhook delivery retry

**Migration complexity:** Critical (~60–80 hrs). Schema is portable Postgres; the blocker is recreating `auth.users` under self-managed auth and re-pointing all FKs without identity loss.

---

## Deliverable 3 — Storage Dependency Inventory

### Buckets
- `certificates` — private, RLS via `storage.objects` policies `students_view_own_certificates` + `admins_manage_certificates`

### Code touchpoints
- `src/lib/certificates/pdf.server.ts` — generate + upload PDF
- `src/lib/certificates/qr.server.ts` — QR for verification URL
- `src/lib/certificates.functions.ts` — issue, list, sign URL
- `src/lib/tech-finance.functions.ts` — `storage.from(...)` for invoice/contract documents
- `src/lib/tech-pdf.server.ts` — tech invoice PDF render + upload
- Document tables (no separate bucket scan; paths stored as `storage_path`): `application_documents`, `visa_documents`, `tech_contract_documents`, `tech_project_documents`, `tech_request_attachments`, `tech_ticket_attachments`

### Flows
- **Upload:** server fns only (no direct browser upload) — `supabaseAdmin.storage.from('certificates').upload(...)`
- **Download:** `createSignedUrl` issued by server fn after RLS check
- **Public read:** none — all buckets private

**Migration complexity:** Medium (~16–24 hrs). Replace with S3-compatible (R2/MinIO/Backblaze) + presigned URLs. `storage.objects` RLS rewritten as application-layer ACL.

---

## Deliverable 4 — Realtime Dependency Inventory

**Direct `supabase.channel(...)`/`postgres_changes` usage:** 0 hits in current codebase.

Files mentioning "realtime" are documentation/SEO content (`src/content/insights.ts`, `case-studies.ts`, `sitemap.xml.ts`) or observability dashboards using polling (`observability.tsx`, `observability.functions.ts`, `observability/events.server.ts`).

Components that *could* use realtime but currently poll via TanStack Query:
- `src/components/notifications/NotificationBell.tsx` — `notifications_unread_count()` on interval
- `src/components/community/LessonDiscussion.tsx` — thread refetch
- `src/routes/_authenticated.community.$slug.$threadId.tsx` — reply refetch

**Migration complexity:** Low (~0–8 hrs). HIGAET does not currently depend on Supabase Realtime. Replacement only needed if realtime UX is later added (Ably/Pusher).

---

## Deliverable 5 — RLS & Security Inventory

### Counts
- ~180 RLS policies across 93 tables
- All authorization flows through 2 SECURITY DEFINER role checks: `has_role(uid, app_role)` and `has_any_role(uid, app_role[])`
- `app_role` enum: `student`, `faculty`, `counselor`, `agent`, `admin`, `super_admin`, plus domain-specific roles

### Security-definer functions (auth-coupled)
`has_role`, `has_any_role`, `notifications_unread_count`, `notifications_mark_all_read`, `notifications_guard_user_update`, `threads_guard_user_update`, `prevent_student_grade_tampering`, `audit_certificate_changes`, `emit_domain_event`, `observability_summary`, `verify_certificate*`, `is_program_eligible`, `match_ai_chunks`, `check_api_rate_limit`, `lease_webhook_deliveries`, `ai_delete_document`, `cleanup_api_rate_limits`

### Permission model
- Roles stored exclusively in `user_roles` (admin-managed, no self-grant) — already follows the secure pattern
- Every policy reads `auth.uid()`; under self-managed auth, must read JWT `sub` claim injected by replacement auth

**Migration complexity:** Medium (~16 hrs). Policies are portable PostgreSQL; only `auth.uid()` → `current_setting('request.jwt.claim.sub')::uuid` (or equivalent) needs swapping.

---

## Deliverable 6 — AI Dependency Inventory

### Lovable AI Gateway (12 files)
| File | Purpose | Models |
|---|---|---|
| `src/lib/ai-gateway.server.ts` | OpenAI-compatible provider via `https://ai.gateway.lovable.dev/v1` | `google/gemini-2.5-flash`, `openai/gpt-5-mini` |
| `src/lib/ai-embeddings.server.ts` | Batch embed → `ai_chunks.embedding` | `openai/text-embedding-3-small` (1536-dim) |
| `src/lib/ai-knowledge.server.ts` / `.functions.ts` | RAG retrieval + grounding | gemini + embeddings |
| `src/lib/ai-tutor.functions.ts`, `ai-coach.functions.ts`, `ai-advisor.functions.ts`, `ai-copilot.functions.ts`, `ai-chat.functions.ts` | Role-specific agents | gemini-flash |
| `src/routes/api/chat.ts` | `streamText` SSE endpoint | gemini-flash |
| `src/routes/api/public/cron/embeddings.ts` | pg_cron drain of `ai_embeddings_queue` | embedding-3-small |
| `src/lib/vector-index/index.ts` | In-memory dense+sparse hybrid index | n/a |
| `src/integrations/lovable/index.ts` | Lovable broker (auth + AI auth header) | n/a |

### Secret
- `LOVABLE_API_KEY` (server-only, non-portable)

### Vector / RAG stack
- `pgvector` 1536-dim, IVFFLAT index, `match_ai_chunks()` cosine
- `ai_embeddings_queue` worker pattern (status, attempts, leased_until)
- `tg_lessons_enqueue_embedding` trigger auto-enqueues on lesson change

### Agent / multi-agent
- `src/lib/agent/*`, `src/lib/multi-agent/*`, `src/lib/conversation/orchestrator.ts`, `src/lib/decision/*`, `src/lib/governor/*`, `src/lib/execution/*`, `src/lib/self-opt/*`, `src/lib/replay/*`, `src/lib/kernel/*`, `src/lib/goal/*`, `src/lib/strategy/*`, `src/lib/simulation/*`, `src/lib/shared-memory/*`, `src/lib/memory-graph/*`, `src/lib/fusion/hybrid-resolver.ts`, `src/lib/intent-router/*`, `src/lib/ai-mode/reasoner.ts` — all call `ai-gateway.server.ts`; provider-agnostic if gateway swapped

**Migration complexity:** Low (~8–12 hrs) given user owns OpenAI/Gemini keys — only `createLovableAiGatewayProvider` → `@ai-sdk/openai` + `@ai-sdk/google` swap.

---

## Deliverable 7 — Migration Difficulty Matrix

| System | Complexity | Effort | Blockers |
|---|---|---|---|
| **AI Gateway** | Easy | 8–12 h | None — user owns provider keys |
| **Realtime** | Easy | 0–8 h | Not currently used |
| **Storage** | Medium | 16–24 h | Re-sign URL flow, port `storage.objects` RLS to app ACL |
| **RLS policies** | Medium | 16 h | Swap `auth.uid()` → JWT claim helper |
| **Auth (incl. MFA, OAuth, sessions, recovery codes)** | **Critical** | 60–80 h | 36 protected server fns, 6 MFA calls, 30 FK fanout, role-claim JWT issuance, Google broker, email recovery flow |
| **Database** | **Critical** | 60–80 h | Recreate `auth.users` under new auth, repoint ~30 FKs, port 44 migrations + 17 SECURITY DEFINER fns + 13 triggers, preserve `pgvector`/`pg_cron`/`pgcrypto`/`citext` |
| **Webhooks / payments** | Medium | 8–12 h | URL re-pointing, HMAC unchanged |
| **pg_cron** | Medium | 4–8 h | Repoint URLs to MilesWeb domain; needs MilesWeb to host PG with pg_cron or external scheduler |
| **TOTAL (full independence)** | — | **170–240 h** | — |

---

## Deliverable 8 — Recommended Preservation Strategy (Phase 1)

### Keep on Supabase Cloud during Phase 1
| Service | Why keep |
|---|---|
| **Auth** | 36 protected fns + MFA + Google OAuth + 30 FK fanout = 60–80 h risk; defer |
| **Database** | 93 tables, `pgvector`, `pg_cron`, 17 SECURITY DEFINER fns, 13 triggers; MilesWeb shared PG lacks `pg_cron`/`pgvector` guarantee |
| **Storage** | `certificates` bucket + `storage.objects` RLS works as-is via service-role from MilesWeb Node |
| **Realtime** | Not currently used → nothing to preserve |
| **RLS** | Lives with database; keep |

### Move in Phase 1 (Lovable runtime → MilesWeb Node)
| Item | Action | Effort |
|---|---|---|
| Nitro preset | `cloudflare-module` → `node-server`; port `src/server.ts` Worker fetch to Node middleware | 6–8 h |
| AI Gateway | Lovable → BYO OpenAI + Google via `@ai-sdk/*`; refactor `ai-gateway.server.ts`, `ai-embeddings.server.ts`, `chat.ts`; drop `LOVABLE_API_KEY` | 8–12 h |
| `pg_cron` targets | Repoint `/api/public/cron/*` URLs to `higaet.com` | 1 h |
| Webhook receivers | Repoint Stripe/Paddle/Supabase webhooks to `higaet.com` | 2 h |
| Deployment | GitHub Actions → SCP → symlink swap → Passenger restart on cPanel | 4–6 h |
| DNS cutover | Hostinger → MilesWeb, 7-day rollback window | 2 h |
| **Phase 1 total** | — | **23–31 h** |

### Preservation verification (Phase 1)
✅ SSR — node-server preset preserves TanStack Start SSR
✅ SEO / AEO / GEO — `head()` + JSON-LD untouched
✅ Dynamic sitemap (`src/routes/sitemap[.]xml.ts`), `public/robots.txt`, `public/llms.txt` — unchanged
✅ Authentication — Supabase Cloud Auth kept; bearer attacher works on Node
✅ Authorization — RLS via Supabase Cloud unchanged
✅ `createServerFn` — Node runtime supports all current handlers
✅ API Routes — `src/routes/api/*` runs on Node
✅ Payments — Stripe/Paddle webhook URL update only
✅ Webhooks — `lease_webhook_deliveries` + dispatcher unchanged
✅ AI Platform / RAG / Knowledge Graph — same `ai_chunks`/`pgvector`; provider swap is transparent to agents
✅ Search Console / Analytics — verification meta unchanged
✅ Future scalability — Phases 2–4 (Storage, Auth, Database self-host) can proceed independently

### Go / No-Go
🟢 **GO** for Phase 1 (Lovable runtime → MilesWeb Node, keep Supabase Cloud + BYO AI keys) — **23–31 h, Low–Medium risk**.
🛑 **NO-GO** for full Supabase replacement in Phase 1 — 170–240 h, Critical risk on Auth + Database, with realistic feature regressions in MFA, OAuth, RLS fidelity.

Audit complete. No code modified. Ready to scope Phase 1 implementation on your signal.
