# HIGAET — Infrastructure & Technology Stack Audit

**Generated:** 2026-07-20
**Method:** Read-only forensic inventory. Every finding is grounded in files present in the repository (`package.json`, `vite.config.ts`, `.github/workflows/`, `src/`, `supabase/migrations/`, `docs/`, `.env.example`). No assumptions.
**Project:** HIGAET (Helen Institute of Gen AI Engineering & Technology)
**Lovable Project ID:** `019358d1-d5d3-491a-8f03-bd2f647a26b3`
**Repo (production):** `higaetapple-stack/higaet`

---

## Section 1 — Executive Summary

| Dimension | Finding |
|---|---|
| Overall architecture | Full-stack **TanStack Start** app (React 19 SSR) on **Nitro** with dual build targets: Cloudflare Workers (Lovable preview / `higaet.lovable.app`) and Node 22 `node-server` preset (MilesWeb `higaet.com`). |
| Deployment model | Build-Once-Promote-Same-Artifact via GitHub Actions → SSH rsync → atomic symlink on MilesWeb cPanel Passenger. Preview also published on Lovable-hosted Cloudflare Workers. |
| Technology maturity | Production-grade. React 19, Vite 7, TanStack Router 1.168, Nitro 3 beta, Node 22 LTS. |
| Production readiness | **~96/100** — repo-side ready; last remaining friction is host-side (cPanel startup file casing, Node 22 selection, install-production.sh first-run). |
| Codebase scale | 370 route files, 59 server functions, 122 `src/lib` modules, 78 Supabase migrations, 17 active GitHub Actions workflows, 68 runtime + 22 dev dependencies. |

**High-level infrastructure diagram (text):**

```
End user
   │
   ▼
DNS (higaet.com registrar + AutoSSL)
   │
   ▼
LiteSpeed / Passenger  (MilesWeb cPanel, Node 22)   ◄──── GitHub Actions deploy (rsync + symlink)
   │                                                          │
   ▼                                                          │
app.js  ──►  .output/server/index.mjs  (Nitro node-server)    │
   │                                                          │
   ├──► React 19 SSR + hydration (TanStack Start)             │
   ├──► TanStack server functions (RPC) + /api file routes    │
   │        │                                                 │
   │        ▼                                                 │
   │     Supabase (Lovable Cloud: Auth / Postgres / RLS /     │
   │                Storage / pg_cron)                        │
   │                                                          │
   ├──► Lovable AI Gateway (chat / embeddings / images)       │
   ├──► Sentry (errors + AI Seer)                             │
   ├──► PostHog (product analytics)                           │
   ├──► Brevo (transactional email)                           │
   ├──► Datadog Synthetics (uptime, optional)                 │
   └──► Stripe / Razorpay (payments — configured, opt-in)     │
                                                              │
Parallel: Lovable preview build → Cloudflare Workers (higaet.lovable.app)
```

---

## Section 2 — Frontend

| Category | Technology | Files | Essential | Removable |
|---|---|---|---|---|
| Framework | **TanStack Start 1.167 + React 19.2** | `src/router.tsx`, `src/routes/**` | ✅ core | ❌ |
| Router | `@tanstack/react-router` 1.168 | `src/routes/**`, `src/routeTree.gen.ts` | ✅ | ❌ |
| Rendering | Hybrid **SSR + hydration** via Nitro | `src/server.ts`, `.output/server/index.mjs` | ✅ | ❌ |
| Build tool | **Vite 7** + `@lovable.dev/vite-tanstack-config` | `vite.config.ts` | ✅ | ❌ |
| Package manager | **bun** (bunfig.toml) + npm (lockfile) | `bunfig.toml`, `package-lock.json` | ✅ | ❌ |
| UI primitives | **Radix UI** (30+ packages) | `src/components/ui/**` | ✅ | ❌ |
| Styling | **Tailwind CSS v4** + `tw-animate-css` | `src/styles.css`, `@tailwindcss/vite` | ✅ | ❌ |
| Icons | **lucide-react** 0.575 | Throughout `src/components/**` | ✅ | ❌ |
| State / data | **@tanstack/react-query** 5.83 | Loaders + components | ✅ | ❌ |
| Forms | **react-hook-form** 7.71 + `@hookform/resolvers` | Auth/CRM/lead forms | ✅ | ❌ |
| Validation | **zod** 4.4 + `@tanstack/zod-adapter` | Server-fn validators, forms | ✅ | ❌ |
| Fonts | Google Fonts (loaded in `__root.tsx` `<head>`) | `src/routes/__root.tsx` | ✅ | ❌ |
| Charts | **recharts** 2.15 | Admin analytics dashboards | ✅ (admin) | ⚠ optional |
| Animations | `tw-animate-css`, `vaul`, embla | Carousels, sheets | ✅ | ❌ |
| Search | **fuse.js** 7.4 | `src/components/site/AcademySearch.tsx` | ✅ | ❌ |
| Markdown | **react-markdown** 10 | AI chat renderers | ✅ (AI) | ⚠ |
| PDF | **pdf-lib** 1.17 | Certificate generation | ✅ (certs) | ⚠ |
| OTP / QR | `input-otp`, `qrcode` | MFA flows | ✅ (auth) | ❌ |
| Product analytics | **posthog-js** 1.396 | `src/lib/analytics/**` | ✅ | ⚠ |
| Error client | **@sentry/react** 10.63 | `src/lib/observability/**` | ✅ | ⚠ |
| AI UI | **@ai-sdk/react** 3.0, **ai** 6.0 | Assistant / tutor | ✅ (AI) | ❌ |
| Toasts | **sonner** 2.0 | Global toaster | ✅ | ❌ |
| Command palette | **cmdk** 1.1 | Site search | ✅ | ❌ |

Image optimization: none dedicated (relies on responsive `<img>` + hosting-level CDN). Recommend adding `unpic` or `@unpic/react` if image workload grows.

---

## Section 3 — Backend

| Item | Implementation | Files |
|---|---|---|
| Runtime | Node 22.x LTS (`.nvmrc`, `package.json engines`) — Cloudflare Workers for Lovable preview | `.nvmrc`, `app.js` |
| Server framework | **Nitro 3** via TanStack Start (`server: { entry: "server" }`) | `vite.config.ts`, `src/server.ts` |
| API architecture | **Typed RPC (server functions)** + **HTTP file routes** for public webhooks | `src/routes/api/**`, `*.functions.ts` |
| Server functions | 59 files matching `createServerFn` | Across `src/lib/**`, `src/routes/**` |
| Middleware (server-fn) | `requireSupabaseAuth`, `attachSupabaseAuth`, `errorMiddleware` | `src/start.ts`, `src/integrations/supabase/auth-*.ts` |
| Authn | **Supabase Auth** (email + Google OAuth + magic link + OTP + MFA scaffolding) | `src/routes/auth.*.tsx`, `src/hooks/useAuth.ts` |
| Authz | Role table + `has_role()` SECURITY DEFINER + `_authenticated` route gate + `RoleGuard` component | `src/components/auth/RoleGuard.tsx`, `supabase/migrations/**` |
| Sessions | Client-side Supabase JS (localStorage + `@supabase/ssr` cookies via auth-attacher) | `src/integrations/supabase/*` |
| Session cookies | Read/attached by `attachSupabaseAuth` on every server-fn call | `src/integrations/supabase/auth-attacher.ts` |
| Security middleware | Response security headers via `src/server.ts` SSR wrapper; CSP is opt-in | `src/server.ts` |
| Rate limiting | Application-level table + policies (`rate_limit_events`, `rate_limit_buckets`); no gateway-level RL | `supabase/migrations/**`, `src/lib/rate-limit/**` |
| Logging | Structured logger with redaction of `token/secret/key/password/authorization` | `src/lib/logger.ts` |
| Health | `/healthz` (liveness), `/readyz` (deep dependency probe), `/api/public/health` | `src/routes/healthz.ts`, `readyz.ts` |

---

## Section 4 — Database

| Item | Detail |
|---|---|
| Engine | **PostgreSQL** managed by Supabase (Lovable Cloud) |
| Project ref (internal) | `xbdwfekhnghrwrteqtvm` |
| ORM | None — direct Supabase JS client (`@supabase/supabase-js` 2.108) and Postgres via PostgREST |
| Migrations | **78** SQL files under `supabase/migrations/` |
| RLS | Enabled on **113 public tables** (per prior audit); every user-facing table has policies |
| Roles | `app_role` enum → `user_roles` table → `has_role(uuid, app_role)` SECURITY DEFINER |
| Grants | `GRANT` block accompanies every `CREATE TABLE` per project convention |
| Storage | Supabase Storage buckets (profile, resumes, program media); Cloudflare R2 secrets scaffolded but opt-in |
| Functions / triggers | Extensive: `handle_new_user`, `has_role`, `has_any_role`, plus RAG / SRE governance functions |
| Views | Used for admin dashboards and readiness snapshots (`env_readiness_snapshots`, `env_readiness_activity`) |
| Cron | `pg_cron` (env-readiness recheck, SRE checklists) |

---

## Section 5 — Authentication

| Provider | Status | Notes |
|---|---|---|
| Email + password | ✅ Live | `src/routes/auth.login.tsx`, `auth.register.tsx` |
| Google OAuth | ✅ Configured | Provider must be enabled in Supabase Auth |
| Magic link | ✅ Scaffolded | Supabase native |
| Email OTP | ✅ Scaffolded | Supabase native |
| MFA (TOTP) | ✅ Scaffolded (UI: `SessionsCard`, `MfaCard`) | Requires user enrollment |
| Apple | ⚠️ Not configured | Not present in `configure_social_auth` calls |
| Anonymous | ❌ Disabled by policy | Per Lovable Cloud rules |
| JWT | Supabase-issued, attached client-side via `auth-attacher` | Bearer to server functions |
| Session management | Supabase JS + `@supabase/ssr` cookies | Server functions consume via `requireSupabaseAuth` middleware |
| `next=` redirect preservation | ✅ Wired through login/register/forgot + MCP consent | `src/routes/auth.*.tsx`, `[.]lovable.oauth.consent.tsx` |

Production readiness: **Ready**. Missing: Apple provider (optional), full MFA rollout policy.

---

## Section 6 — AI Infrastructure

| Component | Detail |
|---|---|
| Gateway | **Lovable AI Gateway** (`LOVABLE_API_KEY`) — helper `createLovableAiGatewayProvider` |
| AI SDK | Vercel **AI SDK v6** (`ai`, `@ai-sdk/react`, `@ai-sdk/openai`, `@ai-sdk/openai-compatible`, `@ai-sdk/google`) |
| MCP | `@lovable.dev/mcp-js` with vite plugin + `.lovable/mcp/manifest.json` + OAuth consent route |
| Providers fallback | `OPENAI_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY` (server-only) |
| Chat | Streaming via `src/routes/api/chat.ts` + `useChat` |
| Embeddings + RAG | `src/lib/ai/**`, `rag-worker` migrations, admin RAG dashboard |
| Prompt libraries | `src/content/ai-prompts.ts`, `src/lib/agent/**` |
| Governance / SRE agents | `src/lib/security/governance/**`, `src/lib/self-opt/**`, `src/lib/rls/predict/**`, `src/lib/aeos/**` |
| Sentry Seer | Auto-issue analysis via `mcp_sentry` |
| Cost model | Per-request via gateway (Lovable free monthly quota, then paid credits) |

---

## Section 7 — Hosting Infrastructure

| Item | Detail |
|---|---|
| Primary hosting | **MilesWeb cPanel** (LiteSpeed + Passenger, Linux) — app root `/home/wnwpopno/higaet.com` |
| Secondary hosting | **Lovable / Cloudflare Workers** — preview + `higaet.lovable.app` |
| Runtime | Node **22.x LTS** on MilesWeb; workerd runtime on Cloudflare |
| Server entry | `app.js` → dynamic import `.output/server/index.mjs` |
| Build target | `BUILD_TARGET=node vite build` → Nitro `node-server` preset |
| CDN | LiteSpeed cache + Cloudflare (via nameservers, optional) |
| SSL | cPanel **AutoSSL** on `higaet.com`; Lovable-managed on `.lovable.app` |
| DNS | Registrar-managed A/CNAME to MilesWeb; Lovable manages `.lovable.app` subdomains |
| Reverse proxy | LiteSpeed → Passenger app instance |
| Domain(s) | `higaet.com` (prod), `higaet.lovable.app` (preview) — staging retired |

---

## Section 8 — DevOps

| Item | Detail |
|---|---|
| Git provider | GitHub — `higaetapple-stack/higaet` |
| Branch strategy | Trunk-based on `main`; feature branches → PR checks → merge |
| Secrets store | GitHub environment `production` + Lovable Cloud runtime secrets |
| Deploy authn | `secrets.SSH_KEY` + `vars.DEPLOY_DIR` |
| Rollback | Symlink revert in `_deploy-kernel.yml` on smoke-test failure |
| Release management | Sentry releases via `sentry-sourcemaps.yml` |

**Active workflows (17):**

| Workflow | Trigger | Purpose |
|---|---|---|
| `pr-checks.yml` | PR | Lint, typecheck, TS1xxx syntax pre-flight, unit, a11y |
| `quality-gates.yml` | PR / push | Coverage + a11y gates |
| `ci.yml` | push `main` | Base CI |
| `_ci-kernel.yml` | reusable | Builds `.output/`, generates `manifest.json`, hard-fails on missing entry |
| `_deploy-kernel.yml` | reusable | SSH rsync, atomic symlink, prune (keep 5), post-deploy smoke |
| `_security-kernel.yml` | reusable | Gitleaks + dependency scan |
| `deploy.yml` | manual / tag | Unified deploy orchestrator |
| `deploy-and-verify.yml` | manual | One-click deploy + `postdeploy-smoke.ts` |
| `deploy-kernel-guard.yml` | PR | Guards changes to `_deploy-kernel.yml` |
| `parity-gate.yml` | PR | Preview↔prod parity |
| `ci-integrity-guard.yml` | PR | Prevents CI tampering |
| `authorization-verification.yml` | schedule | RLS/role matrix |
| `launch-readiness.yml` | manual | Full launch checklist |
| `scheduled.yml` | cron | Nightly maintenance |
| `sre-e2e.yml` | webhook/manual | SRE E2E suite |
| `sentry-sourcemaps.yml` | push | Uploads sourcemaps + release |
| `datadog-synthetics.yml` | cron | Uptime synthetics (optional secret-gated) |

---

## Section 9 — Monitoring

| Tool | Purpose | Files / config |
|---|---|---|
| **Sentry** (`@sentry/react` + vite plugin) | Errors, releases, sourcemaps, Seer AI analysis | `vite.config.ts` sentryVitePlugin, `src/lib/observability/**` |
| **PostHog** | Product analytics (EU host) | `posthog-js`, `VITE_POSTHOG_KEY` |
| **Datadog Synthetics** | Uptime + latency probes | `.github/workflows/datadog-synthetics.yml` (secret-gated) |
| **GA4 / GTM / Meta Pixel / Clarity / LinkedIn** | Marketing analytics (opt-in via env) | `.env.example` |
| Health probes | `/healthz`, `/readyz`, `/api/public/health?deep=1` | `src/routes/*.ts` |
| Structured logging | JSON logs with secret redaction | `src/lib/logger.ts` |
| Audit logging | `admin_audit_log`, `env_readiness_activity` | Migrations |
| System dashboard | Read-only observability | `src/routes/system-dashboard.tsx` |

---

## Section 10 — Security

| Control | State |
|---|---|
| CSP | Applied in `src/server.ts` response wrapper |
| Security headers | HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy |
| Rate limiting | App-level (Postgres tables + policies) — no gateway RL |
| Secrets management | Lovable Cloud runtime secrets + GitHub `production` env; no `.env.production` committed (`.gitignore` verified) |
| Environment variables | Split public (`VITE_*`) vs server-only (`process.env.*`) |
| RLS | Enabled on all 113 public tables |
| Encryption | TLS end-to-end (AutoSSL / Cloudflare); Postgres at rest via Supabase |
| Password policy | Supabase Auth defaults |
| MFA | TOTP scaffolding present |
| CSRF | Bearer-token model (no cookie-only auth) mitigates; server functions verify JWT |
| XSS | React auto-escaping + CSP + `beforeSend` header stripping in Sentry |
| Secret scans | Gitleaks in `_security-kernel.yml` + `code--dependency_scan` on PRs |
| Log hygiene | `console.log(process.env.*)` scan clean per audit doc |

**Weaknesses / recommendations:** Historic broad `anon` grants on 3 admin tables (RLS mitigates); consider follow-up REVOKE migration. Apple OAuth not configured.

---

## Section 11 — External Services

| Service | Purpose | Features used | Secrets | Status |
|---|---|---|---|---|
| Supabase (Lovable Cloud) | Auth, DB, storage, edge scheduling | RLS, pg_cron, Storage, Auth OAuth | `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | ✅ Live |
| Lovable AI Gateway | LLM / embeddings / images | Streaming chat, embeddings | `LOVABLE_API_KEY` (managed) | ✅ Live |
| Lovable MCP | Model Context Protocol integration | OAuth consent, tool exposure | Managed | ✅ Live |
| GitHub | VCS + Actions | Workflows, secrets, environments | `GITHUB_TOKEN`, `GITHUB_REPO`, `GITHUB_OPS_TOKEN` | ✅ Live |
| MilesWeb | Hosting (cPanel Node) | Passenger, AutoSSL, cron | SSH keypair | ✅ Live |
| Sentry | Errors + Seer | React SDK, sourcemaps, releases, webhook | `SENTRY_AUTH_TOKEN`, `SENTRY_ORG_SLUG`, `SENTRY_PROJECT_SLUG`, `SENTRY_WEBHOOK_SECRET` | ⚠ Auth token pending |
| PostHog | Product analytics | Autocapture, feature flags | `VITE_POSTHOG_KEY` | ⚙ Optional |
| Datadog | Synthetics | API + APP key | `DATADOG_API_KEY`, `DATADOG_APP_KEY` | ⚙ Optional |
| Brevo | Transactional email | SMTP + API | `BREVO_API_KEY`, `EMAIL_FROM_*` | ✅ Live |
| Google | OAuth + Fonts + GA4/GTM | Provider config | Publishable IDs | ✅ Live |
| Stripe | Payments (India + intl) | Checkout, webhooks | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | ⚙ Configured, opt-in |
| Razorpay | Payments (India primary) | Orders, webhooks | Env-gated | ⚙ Configured |
| Cloudflare R2 | Object storage | S3-compatible | `R2_*` | ⚙ Opt-in |
| OpenAI / Gemini / Groq / OpenRouter | AI provider fallbacks | Chat, embeddings | `*_API_KEY` | ⚙ Opt-in |
| Sentry MCP | Agent-side issue triage | MCP tools | — | ✅ Live (dev-time) |

---

## Section 12 — Packages

**68 production dependencies · 22 dev dependencies · Node 22.x**

**Production categories:**

- **Framework core (7):** `react`, `react-dom`, `@tanstack/react-router`, `@tanstack/react-start`, `@tanstack/router-plugin`, `@tanstack/react-query`, `@tanstack/zod-adapter`
- **UI primitives (25):** `@radix-ui/*` — used across `src/components/ui/**`
- **Styling (4):** `tailwindcss`, `@tailwindcss/vite`, `tailwind-merge`, `tw-animate-css`
- **Forms + validation (3):** `react-hook-form`, `@hookform/resolvers`, `zod`
- **AI (5):** `ai`, `@ai-sdk/react`, `@ai-sdk/openai`, `@ai-sdk/openai-compatible`, `@ai-sdk/google`
- **Backend clients (3):** `@supabase/supabase-js`, `@lovable.dev/cloud-auth-js`, `@lovable.dev/mcp-js`
- **Observability (2):** `@sentry/react`, `posthog-js`
- **UX widgets (10):** `sonner`, `cmdk`, `vaul`, `embla-carousel-react`, `input-otp`, `qrcode`, `react-day-picker`, `react-resizable-panels`, `react-markdown`, `lucide-react`
- **Data / util (6):** `date-fns`, `fuse.js`, `clsx`, `class-variance-authority`, `recharts`, `pdf-lib`
- **Build (3):** `vite-tsconfig-paths`, `@types/qrcode`, misc

**Dev categories:**

- Testing: `@playwright/test`, `@axe-core/playwright`, `vitest` (via c8 wrapper), `c8`
- Lint / format: `eslint`, `eslint-config-prettier`, `eslint-plugin-*`, `prettier`, `globals`
- Types: `@types/node`, `@types/react`, `@types/react-dom`, `typescript` 5.8
- Build glue: `@lovable.dev/vite-tanstack-config`, `@vitejs/plugin-react`, `nitro` 3 beta, `@sentry/vite-plugin`

None marked safe-to-remove by static analysis; all are wired to at least one file.

---

## Section 13 — Environment Variables

**Public (client, `VITE_*`)** — safe to expose:

| Variable | Required | Purpose |
|---|---|---|
| `VITE_SITE_URL` | ✅ | Canonical URL |
| `VITE_CONTACT_EMAIL` | ✅ | Footer / CTAs |
| `VITE_SUPABASE_URL` / `_PUBLISHABLE_KEY` / `_PROJECT_ID` | ✅ (auto) | Managed by Lovable Cloud |
| `VITE_SENTRY_DSN` / `VITE_SENTRY_ENV` | ⚙ | Client error reporting |
| `VITE_POSTHOG_KEY` / `VITE_POSTHOG_HOST` | ⚙ | Product analytics |
| `VITE_GA4_ID`, `VITE_GTM_ID`, `VITE_META_PIXEL_ID`, `VITE_CLARITY_ID`, `VITE_LINKEDIN_PARTNER_ID`, `VITE_GSC_VERIFICATION` | ⚙ | Marketing analytics |
| `VITE_API_BASE_URL` | ⚙ | Future Node API |
| `VITE_GIT_COMMIT_SHA` | ⚙ | Build attribution |

**Server-only (secrets):**

| Variable | Required | Purpose |
|---|---|---|
| `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Server DB access |
| `SESSION_SECRET` | ✅ | Env-readiness gate (future session use) |
| `LOVABLE_API_KEY` | ✅ (managed) | AI Gateway |
| `SENTRY_AUTH_TOKEN`, `SENTRY_ORG_SLUG`, `SENTRY_PROJECT_SLUG`, `SENTRY_WEBHOOK_SECRET` | ✅ | Sourcemaps + webhook |
| `GITHUB_TOKEN`, `GITHUB_REPO`, `GITHUB_OPS_TOKEN` | ✅ | SRE agent + Actions |
| `SRE_E2E_TRIGGER_SECRET`, `SRE_E2E_BEARER` | ✅ | SRE workflow auth |
| `BREVO_API_KEY`, `EMAIL_FROM_ADDRESS`, `EMAIL_FROM_NAME`, `EMAIL_REPLY_TO` | ✅ | Transactional email |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | ⚙ | Payments |
| `OPENAI_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY` | ⚙ | AI fallbacks |
| `DATADOG_API_KEY`, `DATADOG_APP_KEY` | ⚙ | Synthetics |
| `CLOUDFLARE_*`, `R2_*` | ⚙ | R2 storage (opt-in) |
| `READYZ_SKIP_SUPABASE` | ⚙ | Diagnostics |
| `CI_AUDIT_INGEST_SECRET`, `LAUNCH_READINESS_INGEST_SECRET`, `DEV_SEED_TOKEN`, `TEST_FIXTURE_PASSWORD` | ✅ (CI) | Internal |

---

## Section 14 — Build System

| Aspect | Value |
|---|---|
| Build commands | `bun run build` (Cloudflare preview) · `bun run build:node` (Node prod) · `build:node:constrained` (LVE-limited hosts) |
| Bundler | Vite 7 (esbuild for minify) |
| Output dir | `.output/` (Nitro) — `.output/server/index.mjs` + `.output/public/**` |
| Build target | Cloudflare Workers (default) / Nitro `node-server` (`BUILD_TARGET=node`) |
| SSR output | `.output/server/index.mjs` boot via `app.js` |
| Static assets | `.output/public/**` |
| Sourcemaps | `hidden`, uploaded to Sentry when `SENTRY_AUTH_TOKEN` + `GIT_COMMIT_SHA` present |
| Manifest | `.output/manifest.json` generated by `_ci-kernel.yml` |
| Prebuild | `production-lock-check.mjs` |

---

## Section 15 — Project Structure

```
higaet/
├─ app.js                     Passenger boot shim (Node prod)
├─ vite.config.ts             Dual-target Nitro + TanStack Start
├─ package.json               68 prod + 22 dev deps, Node 22.x
├─ .github/workflows/         17 active workflows (kernels + gates)
├─ scripts/                   CI validators + postdeploy verifiers
├─ supabase/migrations/       78 SQL migrations (schemas, RLS, cron)
├─ src/
│  ├─ routes/                 370 route files (TanStack file-based)
│  │  ├─ __root.tsx           Root layout + head metadata
│  │  ├─ _authenticated.*.tsx Auth-gated dashboard tree
│  │  ├─ [.mcp]/, [.well-known]/, [.]lovable.oauth.consent.tsx  MCP OAuth surface
│  │  ├─ api/                 HTTP file routes (webhooks, health)
│  │  └─ healthz.ts, readyz.ts
│  ├─ lib/                    122 modules (ai, rls, security, self-opt, agent, aeos, ...)
│  ├─ components/             UI, admin, site, security, ai, career, lms, community
│  ├─ integrations/supabase/  Managed clients + auth middleware
│  ├─ content/                Content registries (academy, industries, technologies, ...)
│  ├─ router.tsx / server.ts / start.ts
│  └─ styles.css              Tailwind v4 entry
├─ tests/
│  ├─ e2e/                    Playwright suites (auth, admin, analytics, a11y)
│  ├─ smoke/                  Smoke matrices (health, rag, embeddings, rbac, admin)
│  └─ integration/            RLS + role matrices
├─ docs/                      Runbooks, audits, infrastructure guides
└─ .lovable/                  ADRs, MCP manifest, plan, roadmap
```

---

## Section 16 — Current Features

| Feature | Frontend | Backend | Tables | Auth |
|---|---|---|---|---|
| Marketing site + SEO clusters | `src/components/site/**`, `src/routes/*` | Dynamic sitemap route | content registries | Public |
| Academy LMS | `src/components/lms/**`, `_authenticated.dashboard.**` | server fns | programs, enrollments, certificates | Learner+ |
| Assistant / AI Tutor | `AiTutor.tsx`, `ChatWindow.tsx` | `routes/api/chat.ts`, `ai-chat.functions.ts` | conversations, messages | Auth |
| Careers + Placements | `career/**` | server fns | jobs, applications, resumes | Learner+ |
| Community + Events | `community/**` | server fns | threads, events | Auth |
| CRM (admin) | `dashboard.admin.crm.*` | server fns | leads, employers | Admin |
| Payments | `payments/**` | Stripe/Razorpay webhooks | orders, invoices | Auth |
| Notifications | `NotificationBell.tsx` | server fns | notifications | Auth |
| Governance / SRE | `dashboard.admin.governance.tsx`, `system-dashboard.tsx` | AI SRE agents | audit_log, sre_* | Admin |
| Env Readiness | `EnvReadinessBanner.tsx`, `dashboard.admin.env-readiness.tsx` | readiness fn + cron | env_readiness_snapshots, activity | Admin |
| Incident Replay | `IncidentReplayPanel.tsx` | Sentry MCP | incidents | Admin |
| MCP OAuth | `[.]lovable.oauth.consent.tsx`, `[.mcp]`, `[.well-known]` | mcp plugin | — | Auth |
| MFA / Security | `MfaCard.tsx`, `SessionsCard.tsx` | Supabase Auth | user_mfa | Auth |

---

## Section 17 — Unused / Legacy

Detected during audit (all read-only findings; nothing removed here):

- Historic staging workflows already retired.
- Broad `anon` grants on 3 admin tables — RLS mitigates; REVOKE migration recommended.
- `Apple` OAuth: no code paths referenced (removable from planning docs unless roadmap requires).
- `DATABASE_URL` in `src/lib/config.server.ts` — commented out; inert.
- Optional CDN/R2 env vars — unused unless R2 activated.

No dead package detected — every dependency maps to at least one importer.

---

## Section 18 — Cost Analysis (estimated USD/month at moderate scale)

| Service | Free tier | Expected prod | Notes |
|---|---|---|---|
| MilesWeb cPanel (Node) | Paid plan | $10–30 | Existing subscription |
| Supabase (Lovable Cloud) | Bundled with Lovable plan | $0 direct | Lovable workspace plan |
| Lovable AI Gateway | Small monthly free quota | $20–200 | Scales with LLM traffic |
| Sentry | 5K errors free | $26+ | Team tier for sourcemaps + Seer |
| PostHog EU | 1M events free | $0–50 | |
| Brevo | 300 emails/day free | $9–29 | Transactional |
| Datadog Synthetics | 10K runs free | $12+ | Optional |
| Stripe / Razorpay | Free (transactional fees) | tx% | 2.9% + 30¢ / 2% |
| Cloudflare (DNS) | Free | $0 | |
| Google Cloud (OAuth + Fonts) | Free | $0 | |
| Domain (higaet.com) | — | ~$15/yr | |

**Baseline monthly total (excluding tx fees):** ~$77–350 depending on AI usage.

---

## Section 19 — Architecture Diagram

```
                        User (Web / Mobile Browser)
                                    │
                                    ▼
                         DNS (higaet.com registrar)
                                    │
                ┌───────────────────┴───────────────────┐
                ▼                                       ▼
       MilesWeb LiteSpeed                    Lovable / Cloudflare Workers
       + Passenger (Node 22)                 (higaet.lovable.app, preview)
                │                                       │
                ▼                                       ▼
        app.js  →  .output/server/index.mjs      Nitro workerd bundle
                │                                       │
                └───────────────┬───────────────────────┘
                                ▼
                     TanStack Start Application
             (React 19 SSR · TanStack Router · TanStack Query)
                                │
        ┌───────────────┬───────┼────────┬──────────────┬───────────────┐
        ▼               ▼       ▼        ▼              ▼               ▼
   Server Fns      /api routes  Auth   AI Gateway     Sentry        PostHog
  (createServerFn) (webhooks)   (Supa)  (Lovable AI)  (errors)      (analytics)
        │               │       │        │              │               │
        └───────────────┴───────┼────────┴──────────────┘               │
                                ▼                                        │
                        Supabase (Lovable Cloud)                         │
                Postgres · RLS · Storage · pg_cron · Auth OAuth          │
                                │                                        │
                                ▼                                        │
                        Brevo (email) · Stripe/Razorpay (payments) ──────┘

                     Above pipeline shipped by:
       GitHub Actions (17 workflows) → SSH rsync → atomic symlink → prune 5
                     Guarded by Sentry sourcemaps + Datadog synthetics
```

---

## Section 20 — Technology Matrix

| Technology | Category | Purpose | Currently Used | Required | Can Remove | Production Ready |
|---|---|---|---|---|---|---|
| React 19 | Frontend | UI framework | ✅ | ✅ | ❌ | ✅ |
| TanStack Start | Meta-framework | SSR + routing | ✅ | ✅ | ❌ | ✅ |
| TanStack Router | Router | File-based routing | ✅ | ✅ | ❌ | ✅ |
| TanStack Query | Data | Loader + cache | ✅ | ✅ | ❌ | ✅ |
| Vite 7 | Build | Bundler | ✅ | ✅ | ❌ | ✅ |
| Nitro 3 (beta) | Server | SSR runtime | ✅ | ✅ | ❌ | ⚠ beta, Renovate pinned |
| Node 22 LTS | Runtime | Prod host | ✅ | ✅ | ❌ | ✅ |
| Cloudflare Workers | Runtime | Preview host | ✅ | ⚙ | ⚙ | ✅ |
| Tailwind v4 | CSS | Styling | ✅ | ✅ | ❌ | ✅ |
| Radix UI | UI | Primitives | ✅ | ✅ | ❌ | ✅ |
| Zod | Validation | Schemas | ✅ | ✅ | ❌ | ✅ |
| Supabase | Backend | DB / Auth / Storage | ✅ | ✅ | ❌ | ✅ |
| Postgres (RLS) | DB | Data + policies | ✅ | ✅ | ❌ | ✅ |
| Lovable AI Gateway | AI | LLM proxy | ✅ | ✅ | ❌ | ✅ |
| AI SDK v6 | AI | Client library | ✅ | ✅ | ❌ | ✅ |
| Lovable MCP | AI | MCP transport | ✅ | ✅ | ❌ | ✅ |
| Sentry | Obs | Errors + Seer | ✅ | ✅ | ❌ | ✅ |
| PostHog | Analytics | Product | ✅ | ⚙ | ⚙ | ✅ |
| Datadog | Obs | Synthetics | ⚙ | ⚙ | ⚙ | ✅ |
| Brevo | Email | Transactional | ✅ | ✅ | ❌ | ✅ |
| Stripe | Payments | Cards intl | ⚙ | ⚙ | ⚙ | ✅ |
| Razorpay | Payments | India | ⚙ | ⚙ | ⚙ | ✅ |
| Cloudflare R2 | Storage | Objects | ⚙ | ⚙ | ⚙ | ✅ |
| GitHub Actions | CI/CD | Pipelines | ✅ | ✅ | ❌ | ✅ |
| MilesWeb | Hosting | Prod | ✅ | ✅ | ❌ | ✅ |
| Playwright | Testing | E2E + a11y | ✅ | ✅ | ❌ | ✅ |
| Vitest / c8 | Testing | Unit + coverage | ✅ | ✅ | ❌ | ✅ |
| ESLint + Prettier | DX | Lint + format | ✅ | ✅ | ❌ | ✅ |
| Gitleaks | Sec | Secret scan | ✅ | ✅ | ❌ | ✅ |

Legend: ✅ live · ⚙ opt-in / configured but not yet activated · ❌ n/a

---

## Section 21 — Final Summary

**Complete technology stack (detected):**

- Frontend: React 19, TanStack Router/Query/Start, Vite 7, Tailwind v4, Radix, react-hook-form, zod, lucide, sonner, recharts, cmdk, embla, vaul, react-day-picker, pdf-lib, fuse.js, react-markdown, posthog-js, @sentry/react, @ai-sdk/react.
- Backend: Nitro 3 (Node 22 or Workers), TanStack server functions, Supabase JS, `@lovable.dev/cloud-auth-js`, `@lovable.dev/mcp-js`, `ai`, AI SDK providers.
- Data: Supabase Postgres (78 migrations, 113 RLS tables, pg_cron), Supabase Storage, optional Cloudflare R2.
- Auth: Supabase (email, Google, magic link, OTP, MFA), JWT bearer via `requireSupabaseAuth`.
- AI: Lovable AI Gateway (default) + OpenAI/Gemini/Groq/OpenRouter fallbacks + Lovable MCP + Sentry Seer.
- Hosting: MilesWeb cPanel (Passenger, Node 22, LiteSpeed) + Lovable Cloudflare Workers preview.
- CI/CD: 17 GitHub Actions workflows (kernels + gates) with SSH deploy, artifact manifest, rollback.
- Monitoring: Sentry, PostHog, Datadog synthetics, GA4/GTM/Meta/Clarity/LinkedIn (opt-in), `/healthz` + `/readyz`.
- Security: RLS, role table + `has_role`, Gitleaks, dependency scanning, CSP + security headers, logger redaction.
- Payments: Stripe + Razorpay (both scaffolded).
- Email: Brevo transactional.

**Scores**

| Dimension | Score | Rationale |
|---|---:|---|
| Overall architecture | **93 / 100** | Modern stack, dual-target build, kernelized CI/CD |
| Production readiness | **96 / 100** | Repo-side ready; residual host-side config |
| Security | **89 / 100** | Strong RLS + secret hygiene; broad `anon` grants on 3 admin tables |
| Scalability | **90 / 100** | Nitro + Postgres + LLM gateway scale horizontally; single MilesWeb node is the current bottleneck |
| Maintainability | **92 / 100** | 122 lib modules well-typed, ADRs + runbooks, strict TS, kernel workflows |

---

## Consolidated Service Table

| Tool / Service | Category | Purpose | Where Used | Required | Production Status |
|---|---|---|---|---|---|
| React 19 | Frontend | UI runtime | `src/**` | Yes | ✅ |
| TanStack Start | Framework | SSR + routing | `src/routes/**`, `src/router.tsx` | Yes | ✅ |
| Vite 7 | Build | Bundler | `vite.config.ts` | Yes | ✅ |
| Nitro 3 | Server | SSR output | `.output/server/index.mjs` | Yes | ✅ beta-pinned |
| Node 22 LTS | Runtime | Prod host | `app.js`, MilesWeb | Yes | ✅ |
| Tailwind v4 | CSS | Styling | `src/styles.css` | Yes | ✅ |
| Radix UI | UI | Primitives | `src/components/ui/**` | Yes | ✅ |
| Zod | Validation | Schemas | server fns + forms | Yes | ✅ |
| Supabase | Backend | Auth/DB/Storage | `src/integrations/supabase/**` | Yes | ✅ |
| Lovable AI Gateway | AI | LLM proxy | `src/lib/ai/**`, `routes/api/chat.ts` | Yes | ✅ |
| Lovable MCP | AI | MCP tools | `.lovable/mcp/**`, routes | Yes | ✅ |
| Sentry | Monitoring | Errors + Seer | `src/lib/observability/**` | Yes | ✅ |
| PostHog | Analytics | Product | `src/lib/analytics/**` | Opt-in | ⚙ |
| Datadog | Monitoring | Synthetics | `.github/workflows/datadog-synthetics.yml` | Opt-in | ⚙ |
| Brevo | Email | Transactional | server fns | Yes | ✅ |
| Stripe | Payments | Cards intl | `src/components/payments/**` | Opt-in | ⚙ |
| Razorpay | Payments | India | payments module | Opt-in | ⚙ |
| Cloudflare R2 | Storage | Objects | secrets scaffolded | Opt-in | ⚙ |
| GitHub Actions | CI/CD | Pipelines | `.github/workflows/**` | Yes | ✅ |
| MilesWeb cPanel | Hosting | Prod | `app.js`, docs/infra | Yes | ✅ |
| Cloudflare Workers | Hosting | Preview | Lovable-managed | Yes | ✅ |
| Playwright | Testing | E2E + a11y | `tests/e2e/**` | Yes | ✅ |
| Vitest + c8 | Testing | Unit + coverage | `package.json` scripts | Yes | ✅ |
| ESLint + Prettier | DX | Lint/format | `eslint.config.js` | Yes | ✅ |
| Gitleaks | Security | Secret scan | `_security-kernel.yml` | Yes | ✅ |
| OpenAI / Gemini / Groq / OpenRouter | AI | Fallback providers | env-gated | Opt-in | ⚙ |
| GA4 / GTM / Meta Pixel / Clarity / LinkedIn | Marketing | Analytics tags | `.env.example` | Opt-in | ⚙ |

Only technologies actually detected in the repo, workflows, docs, or `.env.example` are listed. Anything not present in the current codebase is omitted.
