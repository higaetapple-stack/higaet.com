# HIGAET Phase 1 Implementation Planning

Planning only. No code changes, no deploys, no migrations executed.

Current: Hostinger DNS → higaet.com → Lovable/Cloudflare Worker → Supabase Cloud → Lovable AI Gateway
Target: Hostinger DNS → higaet.com → MilesWeb Node.js (Passenger) → Supabase Cloud → OpenAI + Gemini direct

Preserves: SSR, SEO/AEO/GEO, sitemap, robots, llms.txt, Auth, RLS, createServerFn, API routes, Payments, Webhooks, AI Platform, RAG, Knowledge Graph, Search Console + Analytics readiness.

---

## Deliverable 1 — AI Provider Migration Plan

**Goal:** Replace Lovable AI Gateway with direct OpenAI + Google Gemini SDKs, preserving AI SDK v5 surface (streamText/generateText/embed) so callers don't change.

### Files requiring modification (12)
- `src/lib/ai-gateway.server.ts` — replace `createOpenAICompatible` gateway with a multi-provider factory (`@ai-sdk/openai`, `@ai-sdk/google`) keyed by model id prefix (`openai/*` → openai, `google/*` → gemini).
- `src/lib/ai-embeddings.server.ts` — swap `https://ai.gateway.lovable.dev/v1/embeddings` fetch for `openai.embedding('text-embedding-3-small')` via `embed`/`embedMany`. Keep 1536 dims + pgvector literal helper unchanged.
- `src/lib/ai-knowledge.server.ts` — same swap; remove `LOVABLE_API_KEY` env read, route through new gateway helper.
- `src/lib/ai-tutor.functions.ts`, `ai-coach.functions.ts`, `ai-advisor.functions.ts`, `ai-copilot.functions.ts`, `ai-hub.functions.ts`, `ai-chat.functions.ts`, `ai-knowledge.functions.ts`, `ai/internal.functions.ts` — no logic change; they already consume the gateway helper. Verify model id strings resolve under new router.
- `src/routes/api/chat.ts` (and any streaming route) — keep `toUIMessageStreamResponse`; remove Lovable run-id header forwarding.
- `.env.example` — add `OPENAI_API_KEY`, `GEMINI_API_KEY`; mark `LOVABLE_API_KEY` deprecated.

### Replacement architecture
```text
caller → getModel("openai/gpt-5-mini" | "google/gemini-2.5-flash" | ...)
            ↓
        providerRouter
        ├── openai(model)   uses OPENAI_API_KEY
        └── google(model)   uses GEMINI_API_KEY
            ↓
        AI SDK streamText / generateText / embed
```

### Model mapping
| Current (Lovable) | Direct |
|---|---|
| `google/gemini-2.5-flash` | `@ai-sdk/google` `gemini-2.5-flash` |
| `google/gemini-2.5-pro` | `@ai-sdk/google` `gemini-2.5-pro` |
| `openai/text-embedding-3-small` | `@ai-sdk/openai` `text-embedding-3-small` |
| `openai/gpt-5-mini` (if used) | `@ai-sdk/openai` `gpt-5-mini` |

### Embeddings migration
- Single batch endpoint (`embedMany`) replaces hand-rolled fetch in `ai-embeddings.server.ts` (lines 5-30) and `ai-knowledge.server.ts` (lines 8-25).
- Vector dims stay 1536 — no DB migration, pgvector schema untouched.
- Re-embedding existing rows NOT required.

### Streaming migration
- AI SDK abstracts SSE; `streamText().toUIMessageStreamResponse()` works identically against `@ai-sdk/openai` and `@ai-sdk/google`.
- Drop `withLovableAiGatewayRunIdHeader` wrapper and `X-Lovable-AIG-*` header forwarding.

### Fallback strategy
- Primary by feature: chat/agents → Gemini 2.5 Flash (cost), reasoning → GPT-5; embeddings → OpenAI.
- Try/catch in `getModel` caller: on 429/5xx from primary, retry with secondary provider (Gemini ↔ OpenAI) using equivalent model from `ai-models-catalog`.
- Circuit breaker: 3 failures in 60s → flip provider for that feature for 5min.

### Cost considerations
- Lovable gateway markup removed; direct pricing applies.
- Add per-request token logging (already partially in `rag-observability.functions.ts`) for cost attribution.
- Gemini 2.5 Flash remains cheapest for high-volume RAG queries.

### Impact on subsystems (all green if helper preserved)
- **AI Tutor / Coach / Advisor / Copilot / Hub**: zero logic change — they call gateway helper.
- **AI Knowledge / RAG**: embeddings path swap only; chunking + pgvector retrieval untouched.
- **Multi-agent (`src/lib/multi-agent/`, `agent/`, `conversation/`, `workflow/`)**: untouched — they use `streamText`/tools through gateway helper.
- **Knowledge Graph (`src/lib/knowledge-graph.ts`, `memory-graph/`)**: untouched.

### Validation checklist
- [ ] Unit: `embedTexts()` returns 1536-dim vector
- [ ] Tutor stream: SSE chunks render in `AiTutor.tsx`
- [ ] RAG: `ai-knowledge.functions.ts` ingest + query roundtrip
- [ ] Agent loop: `stopWhen: stepCountIs(50)` still terminates
- [ ] Fallback: kill OPENAI_API_KEY → chat falls to Gemini
- [ ] Cost log: token usage recorded per call

**Estimated effort: 8–12 hrs.**

---

## Deliverable 2 — Authentication Preservation Plan

**Goal:** Auth/Authz behavior identical after runtime swap. Supabase Cloud remains source of truth.

### Files requiring NO modification
- `src/integrations/supabase/client.ts` (browser client)
- `src/integrations/supabase/client.server.ts` (admin)
- `src/integrations/supabase/auth-middleware.ts` (`requireSupabaseAuth`)
- `src/integrations/supabase/auth-attacher.ts`
- `src/integrations/supabase/types.ts`
- All 36 `*.functions.ts` files using `.middleware([requireSupabaseAuth])`
- All RLS policies, `has_role()`, `user_roles` table — DB-level, runtime-agnostic
- `src/routes/_authenticated/route.tsx` gate

### Files requiring modification
- `src/start.ts` — verify `attachSupabaseAuth` middleware present (no change if already wired).
- `src/server.ts` — adjust Nitro/server entry for `node-server` preset (see Deliverable 4).
- `vite.config.ts` — change Nitro preset `cloudflare-module` → `node-server`.

### Flows (unchanged)
```text
Browser → Supabase JS (publishable key) → /auth → session in localStorage
       ↓
Browser → useServerFn(fn) → POST /_serverFn/... with Authorization: Bearer <jwt>
       ↓
Node (Passenger) → attachSupabaseAuth (global functionMiddleware)
       ↓
requireSupabaseAuth → supabase.auth.getUser(jwt) → context.{supabase,userId,claims}
       ↓
PostgREST query → RLS evaluated with auth.uid() → result
```

API routes under `src/routes/api/` keep `Authorization` header parsing identical — Node/Passenger forwards headers like Cloudflare Workers.

### Risks
- **Low**: header casing — Passenger normalizes; Supabase JS sends `Authorization` correctly.
- **Low**: cookie/SameSite changes — none, JWT lives in localStorage.
- **Medium**: SSR fetch base URL — `_authenticated` loader runs at SSR; ensure `VITE_SUPABASE_URL` resolvable from Node.

### Validation tests
- [ ] Sign in via Google + email/password
- [ ] `/dashboard` loader returns user data (proves SSR + RLS)
- [ ] Admin-only RPC `has_role(uid,'admin')` gated
- [ ] Sign out clears session; protected routes redirect to `/auth`
- [ ] `supabaseAdmin` privileged fn rejects non-admin

**Estimated effort: 4–6 hrs (mostly verification, not code).**

---

## Deliverable 3 — Environment Variable Mapping

Security classes: P=Public, I=Internal, S=Secret, CS=Critical Secret.

### GitHub Actions Secrets
| Var | Purpose | Class |
|---|---|---|
| `MILESWEB_SSH_HOST` | deploy target | I |
| `MILESWEB_SSH_USER` | cPanel user | I |
| `MILESWEB_SSH_KEY` | deploy key | CS |
| `MILESWEB_APP_PATH` | app root | I |
| `OPENAI_API_KEY` | build-time smoke | CS |
| `GEMINI_API_KEY` | build-time smoke | CS |

### cPanel Node.js Environment Variables (runtime)
| Var | Purpose | Req | Source | Class |
|---|---|---|---|---|
| `NODE_ENV` | production | ✓ | static | P |
| `PORT` | Passenger-injected | ✓ | Passenger | I |
| `SUPABASE_URL` | server SB client | ✓ | Supabase | I |
| `SUPABASE_PUBLISHABLE_KEY` | server public reads | ✓ | Supabase | I |
| `SUPABASE_SERVICE_ROLE_KEY` | admin client | ✓ | Supabase | CS |
| `OPENAI_API_KEY` | direct OpenAI | ✓ | OpenAI | CS |
| `GEMINI_API_KEY` | direct Gemini | ✓ | Google AI Studio | CS |
| `SESSION_SECRET` | cookie/session encryption | ✓ | generated 64ch | CS |
| `STRIPE_SECRET_KEY` | payments | ✓ | Stripe | CS |
| `STRIPE_WEBHOOK_SECRET` | webhook sig | ✓ | Stripe | CS |
| `RESEND_API_KEY` or SMTP_* | transactional email | opt | provider | S |
| `WEBHOOK_SIGNING_SECRET` | inbound webhooks | ✓ | generated 64ch | CS |
| `SITE_URL` | canonical (https://higaet.com) | ✓ | static | P |
| `LOG_LEVEL` | observability | opt | static | P |

### Local Development Variables (`.env`)
Same as above + `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID` (browser, P).

### Production Variables
All cPanel vars above; managed via cPanel "Setup Node.js App" → Environment variables panel.

### Supabase Variables
`SUPABASE_URL` (I), `SUPABASE_PUBLISHABLE_KEY` (I), `SUPABASE_SERVICE_ROLE_KEY` (CS), `VITE_SUPABASE_*` mirrors (P/I).

### OpenAI Variables
`OPENAI_API_KEY` (CS), `OPENAI_ORG_ID` (opt, I), `OPENAI_PROJECT_ID` (opt, I).

### Gemini Variables
`GEMINI_API_KEY` (CS), `GOOGLE_GENAI_BASE_URL` (opt, I).

### Payments Variables
`STRIPE_SECRET_KEY` (CS), `STRIPE_WEBHOOK_SECRET` (CS), `STRIPE_PUBLISHABLE_KEY` (P, exposed via `VITE_`).

### Webhook Variables
`WEBHOOK_SIGNING_SECRET` (CS), `WEBHOOK_ALLOWED_ORIGINS` (I).

### Analytics / Search Console Variables
`VITE_GA4_MEASUREMENT_ID` (P), `VITE_GSC_VERIFICATION` (P), `SENTRY_DSN` (I, optional).

### Future Variables (Phase 2/3)
`PERPLEXITY_API_KEY` (CS), `PINECONE_API_KEY` (CS, if leaving pgvector), `REDIS_URL` (CS, rate limiting), `POSTGRES_URL` (CS, if moving DB).

### Deprecated post-Phase-1
`LOVABLE_API_KEY` — remove after AI swap verified.

---

## Deliverable 4 — MilesWeb Production Deployment Runbook

### MilesWeb Node.js App Setup (cPanel → Setup Node.js App)
- **Node version**: 22 LTS (matches TanStack Start v1 requirements; verify MilesWeb supports — fallback Node 20 LTS)
- **Application mode**: Production
- **Application root**: `/home/<cpuser>/apps/higaet`
- **Application URL**: `higaet.com`
- **Application startup file**: `.output/server/index.mjs` (TanStack Start node-server preset output)
- **Passenger config** (`/home/<cpuser>/apps/higaet/.htaccess` auto-generated; verify `PassengerNodejs` points to selected Node).

### Build Process (local or CI)
```bash
bun install --frozen-lockfile
bun run build          # produces .output/ with node-server preset
tar czf release.tgz .output package.json bun.lockb
```

### Deployment Process
1. `scp release.tgz` to `~/releases/<timestamp>/`
2. Extract; `cd .output && npm install --omit=dev` (only if preset externals)
3. Atomic symlink: `ln -sfn ~/releases/<timestamp> ~/apps/higaet/current`
4. Restart: `touch ~/apps/higaet/tmp/restart.txt` (Passenger graceful reload)

### DNS Cutover
- Lower Hostinger A/AAAA TTL to 300s 24h ahead.
- Cutover window: change A record to MilesWeb IP; keep Lovable as fallback CNAME for 24h.
- Verify with `dig higaet.com @1.1.1.1`.

### SSL Verification
- cPanel → SSL/TLS Status → AutoSSL for `higaet.com` + `www.higaet.com`.
- Verify HSTS header present; redirect 80→443 via .htaccess.

### Search Console Verification
- Re-verify DNS TXT record (unchanged).
- Submit fresh `https://higaet.com/sitemap.xml`.
- Inspect URL → "Live test" on `/`, `/academy`, `/technologies`.

### Analytics Verification
- GA4 Realtime: load homepage; confirm event.
- Check `robots.txt`, `sitemap.xml`, `llms.txt` return 200 with correct content-type.

### AI Validation
- Hit `/api/chat` with curl → SSE stream from Gemini.
- Trigger AI Tutor session in browser; verify response + token log.
- RAG query through `ai-knowledge.functions.ts` returns chunks.

### Authentication Validation
- Sign in (email + Google); inspect Network → `Authorization: Bearer ...` on serverFn calls; protected route loads.

### Payment Validation
- Stripe test mode checkout; webhook receives `checkout.session.completed`; signature verified.

### Webhook Validation
- Send signed test POST to `/api/public/<hook>`; HMAC validated; row persisted.

### RAG Validation
- Ingest doc → embeddings table row count increments; query returns top-K with cosine sim > 0.7.

### SEO Validation
- View-source on `/`, `/academy/*`, `/technologies/*`: unique `<title>`, meta description, canonical, og:image, JSON-LD.
- `curl -I` confirms 200 + correct cache-control.

### Rollback Procedure
1. Revert Hostinger A record to previous Lovable IP (TTL 300s = ~5min propagation).
2. Or: `ln -sfn ~/releases/<previous> ~/apps/higaet/current && touch tmp/restart.txt`.
3. Confirm `dig` + browser smoke test.
4. Postmortem ticket within 24h.

**Estimated effort: 10–14 hrs setup + 2–4 hrs cutover.**

---

## Deliverable 5 — Phase 1 Execution Plan

Sequenced tasks. Total: **23–34 hrs**.

| # | Task | Files | Hrs | Deps | Risk | Test | Rollback |
|---|---|---|---|---|---|---|---|
| 1 | Add OpenAI + Gemini secrets via add_secret | env only | 0.5 | — | Low | env present | delete secret |
| 2 | Install `@ai-sdk/openai`, `@ai-sdk/google` | package.json | 0.5 | 1 | Low | build green | bun remove |
| 3 | Refactor `ai-gateway.server.ts` to provider router | 1 file | 3 | 2 | Med | unit test | git revert |
| 4 | Swap embeddings to `@ai-sdk/openai` `embed` | `ai-embeddings.server.ts`, `ai-knowledge.server.ts` | 2 | 3 | Med | embed roundtrip | git revert |
| 5 | Verify all 12 AI consumer fns + streaming route | 12 files (no edits expected) | 2 | 3,4 | Low | per-feature smoke | n/a |
| 6 | Add fallback wrapper (try OpenAI→Gemini) | gateway helper | 2 | 3 | Low | kill-key test | flag off |
| 7 | Switch Nitro preset to `node-server` | `vite.config.ts` | 1 | — | Med | local build | revert preset |
| 8 | Adjust `src/server.ts` for Node entry | 1 file | 1.5 | 7 | Med | `node .output/server/index.mjs` boots | revert |
| 9 | Local smoke: auth + RAG + chat on Node build | — | 2 | 5,8 | Med | full e2e | n/a |
| 10 | Provision MilesWeb Node app + env vars | cPanel | 1.5 | — | Low | app starts | delete app |
| 11 | CI deploy pipeline (GH Actions → SSH) | `.github/workflows/deploy.yml` | 3 | 10 | Med | dry-run deploy | disable workflow |
| 12 | Staging deploy to MilesWeb subdomain | — | 1.5 | 11 | Med | staging smoke | redeploy prev |
| 13 | Full validation suite on staging | — | 3 | 12 | Med | checklist D4 | n/a |
| 14 | Lower Hostinger TTL 24h pre-cutover | DNS | 0.25 | 13 | Low | dig TTL | revert TTL |
| 15 | Production DNS cutover + monitor 2h | — | 2 | 14 | High | live smoke | revert A record |
| 16 | Remove `LOVABLE_API_KEY` references | env + helper | 1 | 15 | Low | grep clean | restore var |

### Start immediately
- Tasks 1–9 (AI swap + Node preset). Reversible, no production impact.

### Wait
- Tasks 10–14 until AI + Node build verified locally.
- Task 15 (cutover) until staging passes 48h soak.

### Do NOT touch in Phase 1
- Supabase schema, migrations, RLS, `auth.users`, storage buckets
- Edge functions (none in use; keep state)
- `src/integrations/supabase/*` autogen files
- Knowledge Graph DB structures
- `multi-agent/`, `agent/`, `kernel/`, `governor/` runtime logic

### Phase 1 checklist
- [ ] OPENAI_API_KEY + GEMINI_API_KEY added
- [ ] Gateway helper routes by model prefix
- [ ] Embeddings via @ai-sdk/openai, 1536 dims preserved
- [ ] Streaming chat works on both providers
- [ ] Fallback flips on primary failure
- [ ] `vite.config.ts` preset = `node-server`
- [ ] `.output/server/index.mjs` boots under Node 22
- [ ] MilesWeb Node app + envs configured
- [ ] CI pipeline deploys atomic releases
- [ ] Staging passes auth/RAG/payments/webhooks/SEO
- [ ] DNS cutover with rollback ready
- [ ] LOVABLE_API_KEY removed

---

## Verdict

**Realistic effort: 25–35 hrs** (matches lower bound; agent + RAG architecture is provider-agnostic via AI SDK, so swap is mechanical). Above 40 hrs only if MilesWeb Node 22 unsupported (forces Node 20 + preset workarounds) or Passenger streaming buffers SSE (requires `PassengerBufferResponse off` + verification).

Awaiting approval to proceed with Task 1.
