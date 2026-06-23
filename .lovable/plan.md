# HIGAET Migration Planning Audit

Planning + architecture only. No code changes, no deploys, no migrations.

Current: Hostinger DNS → higaet.com → Lovable Runtime (Cloudflare Workers) → Supabase → Lovable AI Gateway
Target direction: Hostinger DNS → higaet.com → MilesWeb Node.js → PostgreSQL → self-managed Auth → self-managed Storage → independent AI providers

---

## Deliverable 1 — Hybrid Architecture (MilesWeb Node + Supabase Cloud + OpenAI/Gemini)

**Architecture:** Hostinger DNS → MilesWeb cPanel Node 20 (Passenger) → Supabase Cloud (Auth + DB + Storage + Realtime) → OpenAI/Gemini direct.

**Engineering tasks & hours**
| Task | Hrs |
|---|---|
| Runtime: switch nitro preset → `node-server`, port `src/server.ts` security headers + correlation id into nitro middleware, add `start` script, pin nitro stable | 6–8 |
| AI: refactor `src/lib/ai-gateway.server.ts` + `ai-embeddings.server.ts` + `routes/api/chat.ts` to `@ai-sdk/openai` / `@ai-sdk/google`, swap embedding model, update `routes/api/public/cron/embeddings.ts` URL | 6–8 |
| Deployment: GitHub Actions build → tar → scp → symlink swap → `tmp/restart.txt`; cPanel Node App config | 4–6 |
| Testing: smoke (auth, RAG, payments, realtime, certs PDF, cron), Lighthouse, security re-lint | 6–8 |
| Cutover: DNS TTL drop, Stripe/Paddle webhook URL update, pg_cron URL update, 7-day rollback window | 3–4 |
| **Total** | **25–34 hrs** |

**Risks:** nitro beta on `node-server`; Passenger cold-start 502s; shared-cPanel WS proxy uncertainty (Realtime stays on Supabase edge so OK); AI cost surprises; pg_cron URL must be stable.

**Rollout:** preset switch on branch → preview build → cPanel staging subdomain → smoke → DNS cutover (low TTL 300s) → 7-day watch.
**Rollback:** Keep Lovable deploy live; revert DNS A record; previous symlink kept on server.

**Ops cost (monthly est.):** MilesWeb ~$5–15, Supabase Cloud Pro $25 (or free), OpenAI ~$20–80 (RAG embeddings + chat), Gemini optional. **vs Lovable+managed: usually cheaper by $20–40/mo, +25–34 hrs once.**

**Benefits:** keeps Auth/Realtime/Storage stable; smallest-blast-radius first step toward independence.
**Drawbacks:** still vendor-locked on Supabase; loses Lovable AI Gateway free credits and edge CDN.

---

## Deliverable 2 — Supabase Auth Replacement

### Option A — Auth.js (NextAuth core)
- Architecture: JWT or DB sessions, OAuth adapters, Postgres adapter via Drizzle/Prisma.
- Pros: large ecosystem, OAuth providers prebuilt, well-documented.
- Cons: opinionated; TanStack Start integration is community-grade; MFA is BYO; not a 1:1 drop-in for `requireSupabaseAuth`.

### Option B — Lucia
- Architecture: session-based, database-of-record sessions, framework-agnostic, you own everything.
- Pros: minimal, transparent, easy to fit TanStack Start middleware, easy to wire to existing Postgres.
- Cons: **Lucia v3 is in maintenance / sunset mode** — author recommends rolling auth from primitives. OAuth/MFA/recovery are BYO.

### Required schema changes (both options)
- New `users` table (replaces `auth.users`) — id, email, hashed_password, email_verified_at, mfa_enrolled, created_at.
- New `sessions` table — id, user_id, expires_at, ip, user_agent.
- New `oauth_accounts` — provider, provider_user_id, user_id.
- New `password_reset_tokens`, `email_verification_tokens`.
- Repoint ~30 FKs from `auth.users(id)` → `public.users(id)`.
- Rewrite `has_role(uuid, app_role)` to read `auth.uid()` replacement from JWT claim (`request.jwt.claim.sub`).
- Migrate `user_mfa_recovery_codes` to new user_id FK.

### File modification inventory (both options)
- `src/integrations/supabase/auth-middleware.ts` — replace
- `src/integrations/supabase/auth-attacher.ts` — replace
- `src/integrations/supabase/client.ts` — drop auth methods
- `src/routes/auth.*.tsx` (login, register, forgot-password, reset, callback) — rewrite
- `src/routes/_authenticated/route.tsx` — rewire session check
- `src/components/security/MfaCard.tsx`, `SessionsCard.tsx`, `SecurityActivity.tsx` — rewrite
- `src/lib/security.functions.ts`, `security/events.server.ts` — rewrite
- All ~80 `*.functions.ts` using `requireSupabaseAuth` — swap middleware import (mechanical)
- Google OAuth: implement `/api/auth/google` + `/callback`
- MFA: TOTP enroll/verify, recovery codes regen
- Password reset: token table + email send via Resend/SES

### Effort
| Option | Hours | Complexity |
|---|---|---|
| Auth.js | 60–80 | High |
| Lucia (DIY primitives) | 70–95 | High |

**Recommended for HIGAET: Auth.js** — broader docs, OAuth adapters built-in, MFA via community plugins. Lucia's sunset makes long-term ownership risky. But **strongest recommendation: don't replace Supabase Auth unless the business requires it** — keep the hybrid (Deliverable 1).

---

## Deliverable 3 — Realtime Replacement

HIGAET realtime touchpoints:
- `src/components/notifications/NotificationBell.tsx` (notifications)
- `src/components/community/LessonDiscussion.tsx` (threads, replies, reactions)
- `event_rsvps` live updates (events page)
- `src/lib/ai-embeddings.server.ts` (queue notify — can use polling)
- Presence: none currently

| Option | Architecture | Monthly cost | Ops | Complexity |
|---|---|---|---|---|
| Pusher Channels | Managed pub/sub | $0–49 (free 200k msg/day) | None | Low |
| Ably | Managed, global, presence built-in | $0–29+ | None | Low |
| Soketi | Self-host Pusher-protocol on VPS | ~$5 VPS | High (you run it) | Medium |
| Native WS | `ws` library on Node | included | Medium | High (auth, scaling, reconnect) |
| Socket.IO | Node + Redis adapter | included + Redis | High | High |

**Shared cPanel reality:** WebSocket upgrade proxying is unreliable → self-host options need a VPS or a separate WS dyno. Managed (Pusher/Ably) sidesteps this entirely.

Files to refactor (all options): the 3 components above + a thin `src/lib/realtime/client.ts` adapter so swap is isolated. Server-side broadcast helpers replace `supabase.channel().send()` writes.

**Effort:** Pusher/Ably 16–24 hrs · Soketi 24–32 hrs · Native WS / Socket.IO 32–48 hrs.

**Recommended for HIGAET: Ably** — built-in presence, cheaper at HIGAET's notification volume, has TanStack-friendly React hooks, edge POPs comparable to Supabase Realtime.

---

## Deliverable 4 — Storage Migration

Current buckets: `certificates` (private, signed URLs from `src/lib/certificates/pdf.server.ts`). Likely future: course media, profile avatars, application documents.

| Option | $/GB | $/GB egress | Complexity | Ops |
|---|---|---|---|---|
| Cloudflare R2 | $0.015 | **$0 egress** | Low | None |
| AWS S3 | $0.023 | $0.09 | Low | None |
| DO Spaces | $5 flat/250 GB | included 1 TB | Low | None |
| MinIO self-host | VPS cost | none | High | You run it |

Touchpoints to update:
- `src/lib/certificates/pdf.server.ts` — upload + signed URL
- `src/lib/certificates.functions.ts` — read
- Any future `application_documents` flows
- RLS-based access → replace with **presigned URLs** (15-min expiry) issued from server functions after `requireSupabaseAuth` + `has_role` check
- Webhook `tech_contract_documents`, `tech_project_documents`, `tech_request_attachments`, `tech_ticket_attachments` flows — same presigned pattern

Replacement architecture: server fn validates auth + ownership → returns presigned PUT (upload) or GET (download) → client uses URL directly → background fn records metadata row in Postgres.

**Effort:** 16–24 hrs (any provider; difference is config, not code).

**Recommended for HIGAET: Cloudflare R2** — zero egress matters for certificate PDFs and academy media; S3-API compatible (`@aws-sdk/client-s3` works unchanged).

---

## Deliverable 5 — Vendor Independence Roadmap

Minimum changes to be Lovable-independent + Cloudflare-independent + AI-provider-independent, preserving every listed system.

| System | Affected files | Hours | Risk |
|---|---|---|---|
| SSR / runtime (Lovable + CF out) | `vite.config.ts`, `src/server.ts` → `src/middleware/*`, `package.json` | 6–8 | Medium |
| AI provider (Lovable Gateway out) | `src/lib/ai-gateway.server.ts`, `ai-embeddings.server.ts`, `ai-chat.functions.ts`, `ai-tutor/coach/advisor/copilot/knowledge.functions.ts`, `multi-agent/*`, `agent/*`, `routes/api/chat.ts`, `routes/api/public/cron/embeddings.ts` | 8–12 | Low |
| Auth / Authorization | see Deliverable 2 | 60–80 | High |
| createServerFn / API routes / middleware | mechanical import swap across ~80 `*.functions.ts` | included | Low |
| Payments / Webhooks | `routes/api/public/webhooks/*`, Stripe/Paddle dashboard URL update | 2–4 | Low |
| Admin / Academy / Hub / Docs / Community / Certificates | no logic changes; depend on auth+storage+realtime swaps above | 0 (covered) | inherited |
| SEO / AEO / GEO / AIO / JSON-LD / FAQ / Course / Service / Breadcrumb / Canonicals / OG | `src/lib/seo/*`, route `head()` — already framework-portable | 0 | None |
| sitemap.xml / robots.txt / llms.txt | `src/routes/sitemap[.]xml.ts`, `public/robots.txt`, `public/llms.txt` — portable | 0 | None |
| Search Console / Bing / AI crawlers | DNS-level, no code | 0 | None |
| Tutor / Coach / Advisor / Copilot / Knowledge / RAG / Embeddings / Vector / Agents | covered under AI provider swap; `pgvector` stays on Postgres | included | Low |
| Analytics / Pixels / Ads readiness | `src/lib/analytics.ts`, root `head()` — already vendor-neutral | 0 | None |
| Realtime | see Deliverable 3 | 16–24 | Medium |
| Storage | see Deliverable 4 | 16–24 | Low |
| Database (if leaving Supabase Cloud) | dump/restore + RLS rewrite for new JWT claim | 60–80 | Critical |

**Total to full independence: 170–250 hrs.** Total to Lovable+CF+AI-provider independence only (keep Supabase Cloud): **40–60 hrs**.

---

## Deliverable 6 — Recommended Migration Sequence

Lowest-risk → highest-risk, each phase independently shippable and revertible via DNS.

| # | Phase | Risk | Hrs |
|---|---|---|---|
| 1 | Runtime: nitro `node-server` + middleware port + GitHub Actions → MilesWeb staging subdomain | **Low** | 10–14 |
| 2 | AI provider: Lovable Gateway → OpenAI/Gemini (BYO keys) | **Low** | 8–12 |
| 3 | Storage: Supabase Storage → Cloudflare R2 (certificates only first, then expand) | **Low–Medium** | 16–24 |
| 4 | Realtime: Supabase Realtime → Ably (notifications first, then community) | **Medium** | 16–24 |
| 5 | Production cutover: DNS Hostinger → MilesWeb, Stripe/Paddle webhook URLs, pg_cron URLs, 7-day watch | **Medium** | 4–6 |
| 6 | (Optional) Auth: Supabase Auth → Auth.js | **High** | 60–80 |
| 7 | (Optional) Database: Supabase Cloud → self-managed Postgres + pgvector + pg_cron | **Critical** | 60–80 |

**Milestones:** M1 = phase 1–2 on staging green. M2 = phase 3–4 on staging green. M3 = production cutover (phase 5). M4 = full independence (phase 6–7) — only if business demands it.

**Rollback strategy:** Each phase ships behind DNS or feature-flag. Keep Lovable deploy alive for 30 days post-cutover; DNS revert is the universal undo. Phase 6/7 require dual-write windows and explicit rollback playbooks.

**Production cutover plan (phase 5):** drop DNS TTL to 300s 48 hrs prior → run security linter + smoke suite on staging → swap A record → monitor error rate, p95, payment success, AI latency for 7 days → keep old symlink + old Lovable deploy 30 days.

**Final recommendation**
1. **Do phases 1–5 only.** ~55–80 hrs, Medium overall risk, achieves Lovable + Cloudflare + AI-vendor independence while keeping Supabase Cloud (which is itself portable Postgres + standard OAuth + S3-API storage).
2. **Defer phases 6–7 indefinitely.** They add 120–160 hrs and Critical risk for marginal independence — Supabase Cloud's Postgres + Auth are already exportable when/if needed.
3. **Total recommended project: 55–80 engineering hours over ~2 weeks, 1 dev.**

Awaiting approval before any implementation.
