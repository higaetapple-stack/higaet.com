# HIGAET AI Independence + Runtime Migration Blueprint

Planning only. No code changes. No deployment. No commits.

---

## Deliverable 1 — AI Provider Abstraction Architecture

### Target architecture

```text
            ┌─────────────────────────────────────────┐
            │   Consumers (Tutor/Coach/Advisor/...)   │
            └───────────────┬─────────────────────────┘
                            │  aiChat / aiEmbed / aiStream
                            ▼
            ┌─────────────────────────────────────────┐
            │      Provider Abstraction Layer         │
            │  router → policy → retry → fallback     │
            │  cost meter · telemetry · circuit break │
            └───┬──────┬──────┬──────┬──────┬─────┬───┘
                │      │      │      │      │     │
              OpenAI Gemini Groq OpenRouter HF  NVIDIA
```

### Components

- **Capability registry** — declares each provider's supported capabilities (`chat`, `embed`, `stream`, `tools`, `vision`, `json-mode`, max-context, $/Mtok in/out, latency tier).
- **Logical model IDs** — consumers request `chat.fast`, `chat.reason`, `embed.small`, `embed.large`, `vision.default`. Router maps logical → physical (`openai/gpt-5-mini`, `google/gemini-3-flash-preview`, etc.).
- **Router** — picks primary by policy (cost / latency / quality / region) per logical ID.
- **Fallback chain** — ordered list per logical ID, e.g. `chat.fast = [groq/llama-3.3-70b, openai/gpt-5-mini, google/gemini-3-flash, openrouter/*]`.
- **Failover triggers** — 429, 5xx, timeout > N ms, schema-validation failure, circuit-open.
- **Retry** — exponential backoff w/ jitter, max 2 attempts per provider before failover; idempotency key for streamed completions.
- **Circuit breaker** — per provider, opens on >X% errors / Y window, half-open probe.
- **Cost control** — token budget per request, daily spend cap per consumer (`tutor`, `coach`, …), kill-switch env flag, model downgrade on budget pressure.
- **Telemetry** — uniform log: `{requestId, consumer, logicalId, provider, model, tokensIn, tokensOut, latencyMs, costUsd, attempt, outcome}`. Sink → Supabase `ai_usage` table.

### Preserved features

Tutor, Coach, Advisor, Copilot, Knowledge, Hub, RAG, Knowledge Graph, agents, embeddings, AI APIs all keep their current call signatures; only their underlying helper is swapped to `aiChat/aiEmbed`.

---

## Deliverable 2 — AI Migration Inventory

| File | Purpose | Current dep | Required change | Complexity | Tests |
|---|---|---|---|---|---|
| `src/lib/ai-gateway.server.ts` | Provider entry | OpenAI + Gemini SDKs (already migrated off Lovable) | Expand into router w/ Groq, OpenRouter, HF, NVIDIA; add policy/fallback/breaker | M | unit: router selection, fallback, breaker |
| `src/lib/ai-embeddings.server.ts` | Embed helper | OpenAI text-embedding-3-small | Add Gemini + HF as fallbacks; preserve 1536 dims | S | golden vectors, dim assertion |
| `src/lib/ai-chat.functions.ts` | Chat server fn | gateway | Switch to logical IDs | S | smoke |
| `src/lib/ai-tutor.functions.ts` | Tutor | gateway | Logical ID `chat.reason` | S | smoke + eval prompt set |
| `src/lib/ai-coach.functions.ts` | Coach | gateway | Logical ID `chat.fast` | S | smoke |
| `src/lib/ai-advisor.functions.ts` | Advisor | gateway | Logical ID `chat.reason` | S | smoke |
| `src/lib/ai-copilot.functions.ts` | Copilot | gateway | Logical ID `chat.fast` + tools | M | tool-call test |
| `src/lib/ai-knowledge.functions.ts` | Knowledge | gateway + embed | Both logical IDs | M | RAG eval |
| `src/lib/ai-hub.functions.ts` | Hub orchestrator | gateway | Logical IDs | S | smoke |
| `src/routes/api/chat.ts` | SSE chat | gateway | Stream-capable router | M | stream e2e |
| `src/routes/api/public/cron/embeddings.ts` | Batch embed | embed helper | Use embed fallback chain | S | dry-run cron |
| `src/lib/vector-index/*` | pgvector ops | embed | Logical embed ID + dim guard | S | index rebuild test |
| `src/lib/multi-agent/*` | Multi-agent loop | gateway | Logical IDs per role | M | scripted scenario |
| `src/lib/agent/*` | Agent runtime | gateway | Logical IDs | M | controller test |
| `src/lib/conversation/orchestrator.ts` | Convo orch | gateway | Logical IDs | S | unit |
| `src/lib/governor/*` | Policy/firewall | n/a | Add cost-cap + breaker hooks | M | policy tests |
| `src/lib/memory-graph/*` | KG ingest | embed | Logical embed ID | S | ingest test |
| `src/lib/intent-router/*` | Intent classify | gateway | `chat.fast` | S | dataset eval |

Complexity legend: S = <2h, M = 2–6h, L = >6h.

---

## Deliverable 3 — Runtime Preservation Plan (Cloudflare → MilesWeb Node)

### Migration steps

1. **Nitro/Vite preset** — `vite.config.ts`: change preset from `cloudflare-module` → `node-server`.
2. **Server entry** — TanStack Start emits `.output/server/index.mjs`; wrap with Phusion Passenger `app.js` shim that imports the handler.
3. **Middleware** — re-implement Cloudflare-specific bits (Workers headers, `request.cf`) using Node `req`/`res`; keep `attachSupabaseAuth`, `errorMiddleware` unchanged.
4. **Security headers** — move from Workers response shim → Node middleware (helmet-style) returning identical CSP/HSTS/Referrer-Policy/Permissions-Policy.
5. **Logging** — replace `console.log` → JSON line logger (pino) writing to stdout; Passenger captures.
6. **Tracing** — request-id middleware (uuid v7) on each request; propagate via `X-Request-ID`.
7. **Static assets** — Vite client build served by Passenger from `dist/client/`; long-cache hashed files; `sitemap.xml`, `robots.txt`, `llms.txt` served as static files generated at build.
8. **Dynamic sitemap** — keep `/api/sitemap.xml` route; cache 1h via `Cache-Control`.
9. **Deployment architecture**

```text
GitHub Actions
  ├─ build (bun install, bun run build)
  ├─ tar dist + .output + package.json
  └─ scp → MilesWeb /home/<user>/releases/<sha>/
            → symlink current → releases/<sha>
            → touch tmp/restart.txt   (Passenger reload)
```

### Preserved

SSR, SEO/AEO/GEO, dynamic sitemap, robots, llms.txt, Supabase Auth, RLS, `createServerFn`, API routes, payments, webhooks all unchanged at the application layer.

---

## Deliverable 4 — Authentication Preservation Plan

### Flow (unchanged post-migration)

```text
Browser ──login──▶ Supabase Auth ──JWT──▶ localStorage (sb-*-auth-token)
   │                                            │
   │  fetch /_serverFn/* with Bearer            │
   ▼                                            ▼
Node (MilesWeb) ─ attachSupabaseAuth ─ requireSupabaseAuth ─ supabase (RLS as user)
```

- `requireSupabaseAuth` middleware: untouched.
- `attachSupabaseAuth` global functionMiddleware in `src/start.ts`: untouched.
- API route auth: existing per-route `getAuthFromRequest` helpers: untouched.
- RLS policies: live in Postgres, runtime-agnostic.

### Files

- **No change**: `integrations/supabase/*`, `start.ts`, all `*.functions.ts` auth middleware, RLS migrations.
- **Possibly touched**: any middleware reading `request.cf.country` → fall back to `cf-ipcountry`/`x-forwarded-for` parser.

### Risks

- Cookie domain on `higaet.com` vs `*.lovable.app` during cutover → mitigate w/ DNS staging on subdomain first.
- Clock skew on MilesWeb host invalidating JWTs → enable NTP, verify `date -u`.

### Validation checklist

- [ ] Login → JWT present in localStorage.
- [ ] `requireSupabaseAuth` server fn returns 200 for signed-in user, 401 otherwise.
- [ ] RLS denies cross-user reads.
- [ ] Refresh-token rotation works across server restart.

---

## Deliverable 5 — Environment Variable Mapping

| Name | Purpose | Location | Time | Class |
|---|---|---|---|---|
| `VITE_SUPABASE_URL` | Browser client | GH Actions build, cPanel, local | build | Public |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Browser client | same | build | Public |
| `SUPABASE_URL` | Server | cPanel, GH Actions | runtime | Internal |
| `SUPABASE_PUBLISHABLE_KEY` | Server public client | cPanel | runtime | Internal |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin client | cPanel, GH (deploy only) | runtime | **Critical Secret** |
| `OPENAI_API_KEY` | Provider | cPanel, GH | runtime | Secret |
| `GEMINI_API_KEY` | Provider | cPanel, GH | runtime | Secret |
| `GROQ_API_KEY` | Provider | cPanel | runtime | Secret |
| `OPENROUTER_API_KEY` | Provider | cPanel | runtime | Secret |
| `HUGGINGFACE_API_KEY` | Provider | cPanel | runtime | Secret |
| `NVIDIA_API_KEY` | Provider | cPanel | runtime | Secret |
| `AI_BUDGET_DAILY_USD` | Cost cap | cPanel | runtime | Internal |
| `AI_KILL_SWITCH` | Disable all AI | cPanel | runtime | Internal |
| `STRIPE_SECRET_KEY` | Payments | cPanel | runtime | **Critical Secret** |
| `STRIPE_WEBHOOK_SECRET` | Webhook verify | cPanel | runtime | Secret |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Browser | build | build | Public |
| `RESEND_API_KEY` / SMTP_* | Email | cPanel | runtime | Secret |
| `WEBHOOK_SHARED_SECRET` | Internal HMAC | cPanel | runtime | Secret |
| `GA4_MEASUREMENT_ID` | Analytics | build | build | Public |
| `GSC_VERIFICATION` | Search Console meta | build | build | Public |
| `SESSION_SECRET` | Cookie encrypt | cPanel | runtime | **Critical Secret** |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_ENDPOINT` | Object store | cPanel | runtime | Secret |
| `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` | DNS/R2 ops | GH | build/admin | Secret |
| `GITHUB_TOKEN` | CI | GH | build | Secret |
| `SSH_HOST` / `SSH_USER` / `SSH_KEY` | Deploy target | GH | build | **Critical Secret** |

GitHub Actions Secrets = all above marked GH. cPanel Node.js Variables = all marked cPanel. Local dev = `.env.local` mirroring cPanel set minus critical secrets.

---

## Deliverable 6 — MilesWeb Production Deployment Runbook

### cPanel Node.js Setup
- Node version: **20 LTS** (or 22 if available).
- Application mode: **Production**.
- Application root: `/home/<user>/apps/higaet`.
- Application URL: `higaet.com`.
- Startup file: `app.js` (Passenger shim importing `.output/server/index.mjs`).
- Passenger: enable, `passenger_friendly_error_pages off`, restart via `tmp/restart.txt`.

### Build (GitHub Actions)
```
bun install --frozen-lockfile
bun run build       # produces dist/ + .output/
tar czf release.tgz dist .output app.js package.json bun.lock
```

### Deploy
```
scp release.tgz $SSH_USER@$SSH_HOST:releases/$SHA.tgz
ssh ... 'mkdir releases/$SHA && tar xzf releases/$SHA.tgz -C releases/$SHA'
ssh ... 'cd apps/higaet && ln -sfn ../../releases/$SHA current'
```

### Restart
```
ssh ... 'mkdir -p apps/higaet/tmp && touch apps/higaet/tmp/restart.txt'
```

### Rollback
```
ssh ... 'ln -sfn ../../releases/<previous_sha> apps/higaet/current && touch apps/higaet/tmp/restart.txt'
```

### DNS Cutover
1. Stage on `staging.higaet.com` → A/AAAA → MilesWeb IP, validate.
2. Lower TTL on `higaet.com` to 300s 24h ahead.
3. Switch A/AAAA to MilesWeb. CNAME `www` → `higaet.com`.
4. Monitor; rollback by reverting A record.

### SSL Validation
- AutoSSL in cPanel issues Let's Encrypt for `higaet.com` + `www`.
- Verify `curl -vI https://higaet.com` → HTTP/2, valid chain, HSTS header.

### Auth Validation
- Sign in flow, refresh, sign out; verify Supabase JWT in browser; protected server fn → 200/401 correctly.

### AI Validation
- Hit Tutor/Coach/Advisor/Copilot; confirm telemetry rows in `ai_usage`; force-fail primary key → fallback fires.

### RAG Validation
- Run embeddings cron; query knowledge endpoint; compare top-k vs baseline.

### Payments Validation
- Stripe test charge; webhook delivery 200; reconciliation row inserted.

### Webhooks Validation
- Send signed test event; verify HMAC; idempotency key dedupes.

### SEO / Search Console / Analytics
- `/sitemap.xml`, `/robots.txt`, `/llms.txt` 200 + correct `Content-Type`.
- GSC URL inspection: live test passes.
- GA4 realtime shows pageview after smoke browse.

---

## Deliverable 7 — Phase 1 Execution Plan

Ordered. **Hrs** are engineering estimates.

| # | Task | Files | Deps | Hrs | Risk | Tests | Rollback |
|---|---|---|---|---|---|---|---|
| 1 | Expand gateway router (Groq/OpenRouter/HF/NVIDIA) | `ai-gateway.server.ts` | provider keys | 4 | M | router unit | revert file |
| 2 | Logical model registry + policy | new `ai-registry.ts` | 1 | 2 | L | unit | revert |
| 3 | Retry/breaker/cost meter | `ai-gateway.server.ts` | 1 | 3 | M | unit + chaos | revert |
| 4 | Telemetry sink table + insert | migration + helper | — | 1 | L | insert test | drop table |
| 5 | Switch all `ai-*.functions.ts` to logical IDs | 8 files | 2 | 2 | L | smoke | per-file revert |
| 6 | Stream router on `/api/chat` | `routes/api/chat.ts` | 1 | 2 | M | e2e stream | revert |
| 7 | Embeddings fallback chain | `ai-embeddings.server.ts`, `vector-index/*` | 1 | 2 | M | dim guard | revert |
| 8 | Vite preset → `node-server` | `vite.config.ts` | — | 1 | H | local prod build | flip back |
| 9 | Passenger `app.js` shim | new | 8 | 1 | M | `node app.js` boot | delete |
| 10 | Security/logging/tracing middleware | `start.ts`, new mw | 8 | 3 | M | header tests | revert |
| 11 | GH Actions deploy workflow | `.github/workflows/deploy.yml` | 9 | 3 | M | dry-run | disable workflow |
| 12 | cPanel Node app provisioned | MilesWeb | 9 | 2 | M | passenger boot | delete app |
| 13 | Staging DNS + smoke | DNS | 12 | 2 | L | runbook §Validation | revert DNS |
| 14 | Production DNS cutover | DNS | 13 | 1 | H | full runbook | revert A record |
| 15 | Post-cutover monitoring 24h | — | 14 | 4 | M | dashboards | rollback symlink |

**Immediate**: 1–7 (AI independence, runtime-agnostic).
**Deferred**: 8–15 (runtime cutover) — execute once MilesWeb provisioned.
**Out of scope**: Supabase migration, Cloudflare R2 swap, payment provider change.

---

## Deliverable 8 — Final Go/No-Go Assessment

- **Total est. hours**: 33 eng hours (1–7: 16h; 8–15: 17h) + 24h soak.
- **Phases**: (A) AI abstraction in current runtime, (B) Node runtime + deploy pipeline, (C) DNS cutover + soak.
- **Critical risks**: cookie domain on cutover; Passenger cold-start latency; AI provider key quota mismatches; pgvector dim drift if embed model changes silently.
- **Blockers**: MilesWeb account + SSH key; cPanel Node 20 availability; all provider keys present in cPanel; lowered DNS TTL 24h before cutover.
- **Recommended order**: A → B (on staging subdomain) → C.

**Preservation confirmation under Phase 1:**

✅ SSR · ✅ SEO · ✅ AEO · ✅ GEO · ✅ Dynamic Sitemap · ✅ robots.txt · ✅ llms.txt · ✅ Authentication · ✅ Authorization (RLS) · ✅ createServerFn · ✅ API Routes · ✅ Payments · ✅ Webhooks · ✅ AI Platform · ✅ RAG · ✅ Knowledge Graph · ✅ Analytics readiness · ✅ Search Console readiness · ✅ Future scalability

**Go** for Phase A immediately. **Conditional Go** for Phases B/C pending MilesWeb provisioning and a successful staging-subdomain dry run.
