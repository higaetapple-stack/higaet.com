# HIGAET Phase 1 Implementation Blueprint

Documentation only. No code changes, no deployment, no migration in this artifact.
Pairs with `.lovable/plan.md` (approved plan) and the existing
`docs/infrastructure/dns-cutover-plan.md` / `dns-migration-sop.md`.

Target architecture:

```text
Hostinger DNS → higaet.com → MilesWeb Node 20 (Passenger)
              → Supabase Cloud (Auth · DB · Storage · RLS)
              → AI Abstraction → OpenAI · Gemini · Groq · OpenRouter · HF · NVIDIA
```

---

## 1. AI Provider Implementation Plan

### 1.1 Module layout (planned)

```text
src/lib/ai/
├── registry.ts          # logical IDs → physical models, capabilities, $/Mtok
├── policy.ts            # routing policy (cost | latency | quality | region)
├── router.ts            # selectPrimary + buildFallbackChain
├── breaker.ts           # per-provider circuit breaker (open/half/closed)
├── retry.ts             # exp backoff + jitter, max 2/provider
├── budget.ts            # daily $ cap per consumer + kill switch
├── telemetry.ts         # writes ai_usage rows
├── providers/
│   ├── openai.ts        # @ai-sdk/openai
│   ├── gemini.ts        # @ai-sdk/google
│   ├── groq.ts          # @ai-sdk/groq
│   ├── openrouter.ts    # @ai-sdk/openai-compatible @ openrouter.ai/api/v1
│   ├── huggingface.ts   # @ai-sdk/openai-compatible @ HF router endpoint
│   └── nvidia.ts        # @ai-sdk/openai-compatible @ integrate.api.nvidia.com/v1
└── index.ts             # aiChat / aiStream / aiEmbed (public API)
```

### 1.2 Logical model registry

| Logical ID       | Primary                       | Fallback chain |
|------------------|-------------------------------|---------------------------------|
| `chat.fast`      | `groq/llama-3.3-70b-versatile`| openai/gpt-5-mini → google/gemini-3-flash-preview → openrouter/auto |
| `chat.reason`    | `openai/gpt-5`                | google/gemini-2.5-pro → openrouter/anthropic-claude-3.7-sonnet |
| `chat.cheap`     | `google/gemini-3.1-flash-lite`| openai/gpt-5-nano → groq/llama-3.1-8b-instant |
| `chat.vision`    | `google/gemini-2.5-pro`       | openai/gpt-5 |
| `chat.tools`     | `openai/gpt-5-mini`           | google/gemini-3-flash-preview |
| `embed.small`    | `openai/text-embedding-3-small` (1536) | huggingface/BAAI/bge-small-en-v1.5 |
| `embed.large`    | `openai/text-embedding-3-large` (3072) | google/gemini-embedding-001 |

Dimension contract is part of the registry; router refuses to substitute an
embedding model whose dims ≠ requested column dims (guards pgvector).

### 1.3 Routing, retry, breaker

- **Select**: `router.selectPrimary(logicalId, policy)` returns ordered list.
- **Retry**: per provider, max 2 attempts, exponential backoff (250 ms, 1 s) + jitter; retry only on 429/5xx/timeout.
- **Failover**: schema-validation failure, breaker-open, exhausted retries → next provider in chain.
- **Breaker**: window 60 s, opens at >40% errors over ≥10 requests, half-open probe every 30 s.

### 1.4 Telemetry + cost control

Migration: `ai_usage` table

```sql
create table public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  request_id text not null,
  consumer text not null,            -- tutor|coach|advisor|copilot|...
  logical_id text not null,
  provider text not null,
  model text not null,
  attempt smallint not null,
  outcome text not null,             -- success|fallback|error|budget_block
  tokens_in int, tokens_out int,
  latency_ms int, cost_usd numeric(10,6)
);
-- grants + RLS: select for service_role only; inserts via server functions
```

Budget guard checks rolling 24 h sum per consumer against `AI_BUDGET_DAILY_USD`
before dispatch; auto-downgrades `chat.reason` → `chat.fast` at 80%, hard
blocks at 100% with explicit error code `BUDGET_EXCEEDED`.

### 1.5 Preserved consumers

Tutor, Coach, Advisor, Copilot, Knowledge, Hub, Agents, Multi-Agent,
Orchestrator, Governor, Memory-Graph, Intent-Router, RAG, Embeddings,
`/api/chat` — all keep current public signatures; only the internal call
site changes from direct `aiChatCompletion(...)` to `aiChat({ logical: "chat.fast", ... })`.

### 1.6 Rate-limit handling

- Honour `Retry-After` from 429 responses; if > 2 s, immediately failover.
- Token-bucket per provider per minute, configured from env (`*_RPM`, `*_TPM`).
- Streaming requests bypass retry on partial output; emit terminal error event so the UI can show "switching model" affordance.

---

## 2. Runtime Migration Plan (Lovable Cloudflare → MilesWeb Node 20)

### 2.1 Files that MUST change

| File | Change |
|---|---|
| `vite.config.ts` | Nitro preset `cloudflare-module` → `node-server` |
| `app.js` (new) | Passenger entry; `import('./.output/server/index.mjs')` |
| `package.json` | `"start": "node .output/server/index.mjs"`, add `pino`, `helmet` |
| `src/start.ts` | Append Node logging + request-id middleware |
| `src/lib/server/security-headers.ts` (new) | CSP/HSTS/Referrer/Permissions |
| `src/lib/server/logger.ts` (new) | pino instance |
| Any handler reading `request.cf.*` | Switch to `cf-ipcountry` / `x-forwarded-for` |
| `.github/workflows/deploy-milesweb.yml` (new) | build → tar → scp → symlink → `tmp/restart.txt` |

### 2.2 Files UNTOUCHED

- All `src/routes/**` page routes, all `*.functions.ts`, all `routes/api/**` handlers.
- All Supabase integration (`src/integrations/supabase/*`).
- All RLS migrations and database functions.
- Sitemap (`/api/sitemap.xml`), `public/robots.txt`, `public/llms.txt`, JSON-LD components.
- SEO `head()` exports on every route.

### 2.3 Preservation

| Concern | How preserved |
|---|---|
| SSR | TanStack Start `node-server` preset emits the same SSR handler |
| SEO/AEO/GEO/AIO | Route `head()` outputs unchanged; JSON-LD components unchanged |
| Dynamic sitemap | Same server route, `Cache-Control: public, max-age=3600` |
| robots/llms | Static files served by Passenger from `dist/client/` |
| Search Console | Existing meta verification + sitemap submission unchanged |
| Analytics | GA4/PostHog client snippets unchanged |
| Future scalability | Stateless Node app; horizontal scale via additional cPanel apps behind LB |

### 2.4 Deployment architecture

```text
GitHub Actions (push to main)
  ├─ checkout
  ├─ bun install --frozen-lockfile
  ├─ bun run build                       # dist/client + .output/server
  ├─ tar -czf release.tgz dist .output app.js package.json bun.lock
  ├─ scp release.tgz $USER@$HOST:releases/$SHA.tgz
  └─ ssh: extract → ln -sfn releases/$SHA current → touch tmp/restart.txt
```

### 2.5 Passenger requirements

- Node 20 LTS (22 if available)
- Application root: `/home/<user>/apps/higaet/current`
- Startup file: `app.js`
- Env vars set in cPanel "Application configuration files"
- `passenger_min_instances 2`, `passenger_max_pool_size 6`
- Graceful restart via `touch tmp/restart.txt`

### 2.6 Rollback

```bash
ssh ... 'ln -sfn ../../releases/<prev_sha> apps/higaet/current \
  && touch apps/higaet/tmp/restart.txt'
```

DNS rollback: revert A/AAAA to current Lovable/Cloudflare targets (kept on
file before cutover); TTL pre-lowered to 300 s.

---

## 3. Authentication Preservation Plan

Auth is application-layer; runtime swap does not touch it.

### 3.1 Request / JWT flow (unchanged)

```text
Browser
  ├─ POST /auth/v1/token  → Supabase Auth (PKCE/OAuth/email)
  ├─ Session stored in localStorage (sb-<ref>-auth-token)
  └─ fetch /_serverFn/* with Authorization: Bearer <jwt>
        ↓
MilesWeb Node
  attachSupabaseAuth (global functionMiddleware)
    ↓ injects supabase client w/ user JWT
  requireSupabaseAuth (route middleware)
    ↓ verifies, attaches { userId, claims }
  handler → supabase queries (RLS as user)
```

### 3.2 Preserved features

Supabase Auth · RLS · `user_roles` + `has_role()` · MFA (TOTP) · Google OAuth · refresh-token rotation · recovery codes — all unchanged.

### 3.3 Validation tests

- [ ] Email/password sign-up + email verification.
- [ ] Google OAuth round-trip on `higaet.com`.
- [ ] MFA enrolment + challenge.
- [ ] Recovery code login.
- [ ] `requireSupabaseAuth` server fn → 401 unauthenticated, 200 authenticated.
- [ ] Cross-user RLS read denied.
- [ ] Admin role: `has_role(uid,'admin')` true gates admin server fns.
- [ ] Refresh-token rotation survives Node restart (`touch tmp/restart.txt`).
- [ ] Session persists across page reload on `higaet.com` (cookie/localStorage domain correct).

---

## 4. Environment Variable Mapping

Legend — P=Public · I=Internal · S=Secret · C=Critical Secret · B=Build · R=Runtime.

| Name | Class | Time | GitHub Secrets | cPanel Vars |
|---|---|---|:-:|:-:|
| `VITE_SUPABASE_URL` | P | B | ✓ | — |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | P | B | ✓ | — |
| `SUPABASE_URL` | I | R | — | ✓ |
| `SUPABASE_PUBLISHABLE_KEY` | I | R | — | ✓ |
| `SUPABASE_SERVICE_ROLE_KEY` | C | R | — | ✓ |
| `OPENAI_API_KEY` | S | R | — | ✓ |
| `GEMINI_API_KEY` | S | R | — | ✓ |
| `GROQ_API_KEY` | S | R | — | ✓ |
| `OPENROUTER_API_KEY` | S | R | — | ✓ |
| `HUGGINGFACE_API_KEY` (`HF_TOKEN`) | S | R | — | ✓ |
| `NVIDIA_API_KEY` | S | R | — | ✓ |
| `AI_BUDGET_DAILY_USD` | I | R | — | ✓ |
| `AI_KILL_SWITCH` | I | R | — | ✓ |
| `STRIPE_SECRET_KEY` | C | R | — | ✓ |
| `STRIPE_WEBHOOK_SECRET` | S | R | — | ✓ |
| `VITE_STRIPE_PUBLISHABLE_KEY` | P | B | ✓ | — |
| `RESEND_API_KEY` / `SMTP_*` | S | R | — | ✓ |
| `WEBHOOK_SHARED_SECRET` | S | R | — | ✓ |
| `GA4_MEASUREMENT_ID` | P | B | ✓ | — |
| `GSC_VERIFICATION` | P | B | ✓ | — |
| `SESSION_SECRET` | C | R | — | ✓ |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_ENDPOINT` | S | R | — | ✓ |
| `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` | S | B | ✓ | — |
| `GITHUB_TOKEN` / `GITHUB_PAT` | S | B | ✓ | — |
| `SSH_HOST` / `SSH_USER` / `SSH_KEY` | C | B | ✓ | — |
| `NODE_ENV=production` | I | R | — | ✓ |

`.env.local` for dev mirrors cPanel set minus any C-class secret unless required locally.

---

## 5. Production Deployment Runbook

### Node App setup (cPanel → Setup Node.js App)
1. Create application; Node 20 LTS; mode Production; root `apps/higaet/current`; URL `higaet.com`; startup `app.js`.
2. Add all R-class env vars from §4.
3. Click "Create" then "NPM Install" (skip — bun handles in CI).

### Passenger setup
- Verify `apps/higaet/tmp/` exists; `touch tmp/restart.txt` reloads.
- `passenger_min_instances 2`, `passenger_max_pool_size 6` (.htaccess if needed).

### SSH setup
- Generate deploy key on workstation: `ssh-keygen -t ed25519 -f deploy_higaet`.
- Add public key to cPanel → SSH Access → Manage SSH Keys → Authorize.
- Add private key + `SSH_HOST`, `SSH_USER` to GitHub repo secrets.

### GitHub Actions
- Workflow `.github/workflows/deploy-milesweb.yml` runs on push to `main`.
- Steps: checkout · setup-bun · install · build · tar · scp · symlink swap · restart · smoke probe.

### Build / Start / Restart
```bash
bun install --frozen-lockfile
bun run build
# start (Passenger handles automatically via app.js)
touch apps/higaet/tmp/restart.txt
```

### Release strategy
- Keep last 5 releases in `releases/`; symlink `current` → active SHA.
- Pre-flight: `node -e "require('./.output/server/index.mjs')"` boot probe.

### Rollback
```bash
ssh ... 'ln -sfn ../../releases/<prev> apps/higaet/current && touch apps/higaet/tmp/restart.txt'
```

### DNS cutover
1. Lower TTL on `higaet.com` to 300 s, 24 h ahead.
2. Validate staging on `staging.higaet.com` (A → MilesWeb IP).
3. Switch `higaet.com` A/AAAA to MilesWeb; `www` CNAME → apex.
4. Monitor `curl -sSf https://higaet.com/healthz` every 30 s for 1 h.
5. Restore TTL to 3600 s after 48 h of stable traffic.

### Validation checklist
- **SSL**: `curl -vI https://higaet.com` → HTTP/2, valid chain, HSTS.
- **Auth**: see §3.3 list.
- **AI**: hit `/api/chat`, force primary key failure → fallback row in `ai_usage`.
- **RAG**: trigger embeddings cron; query Knowledge endpoint; top-k matches baseline.
- **Payments**: Stripe test charge → webhook 200 → reconciliation row.
- **Webhooks**: signed test event → HMAC verify → idempotency dedupe.
- **SEO**: `/sitemap.xml`, `/robots.txt`, `/llms.txt` 200, correct `Content-Type`; GSC URL inspection passes; JSON-LD validates in Rich Results test.
- **Analytics**: GA4 realtime shows pageview after smoke browse.

---

## 6. Phase 1 Confirmation

### Implementation order (canonical — also in `.lovable/plan.md`)

| # | Task | Hrs | Risk |
|--:|---|--:|:-:|
| 1 | Expand gateway router (Groq, OpenRouter, HF, NVIDIA) | 4 | M |
| 2 | Logical model registry + policy | 2 | L |
| 3 | Retry / breaker / cost meter | 3 | M |
| 4 | `ai_usage` migration + telemetry helper | 1 | L |
| 5 | Switch all `ai-*.functions.ts` to logical IDs | 2 | L |
| 6 | Stream router on `/api/chat` | 2 | M |
| 7 | Embeddings fallback chain + dim guard | 2 | M |
| 8 | Vite preset → `node-server` | 1 | H |
| 9 | Passenger `app.js` shim | 1 | M |
| 10 | Security headers + pino + request-id middleware | 3 | M |
| 11 | GitHub Actions deploy workflow | 3 | M |
| 12 | cPanel Node app provisioned + env vars | 2 | M |
| 13 | Staging subdomain DNS + smoke | 2 | L |
| 14 | Production DNS cutover | 1 | H |
| 15 | 24 h post-cutover monitoring | 4 | M |

**Total: ~33 engineering hours + 24 h soak.**

### Risk assessment

| Risk | Mitigation |
|---|---|
| Cookie/session domain mismatch at cutover | Stage on `staging.higaet.com` first; verify Supabase site URL list includes both apex and `www` |
| Passenger cold-start latency | `passenger_min_instances 2`; warm-up probe in deploy step |
| Provider quota mismatch | Pre-flight smoke against each provider with smallest model |
| pgvector dim drift | Router refuses dim-mismatched embedding substitution; CI assertion |
| DNS propagation surprise | TTL lowered 24 h ahead; rollback record on hand |
| Build artifact size on cPanel | Strip `node_modules` from tarball; rely on `.output` |

### Blockers

- MilesWeb cPanel account + SSH key.
- Node 20 availability on the assigned hosting plan.
- All provider keys present (OpenAI, Gemini, Groq, OpenRouter, HF, NVIDIA).
- Stripe + Resend keys mirrored to cPanel.
- `SESSION_SECRET` generated (32+ bytes random) and stored in cPanel only.

### Staging plan

1. Provision `staging.higaet.com` A record → MilesWeb IP.
2. Deploy via the new workflow with `--target staging`.
3. Run validation checklist end to end on staging.
4. Sign-off gate before touching production DNS.

### Production plan

1. Freeze main branch; tag `v-cutover-<date>`.
2. Deploy tagged release to `apps/higaet/releases/<sha>`.
3. Smoke on direct origin IP (`curl --resolve higaet.com:443:<ip>`).
4. Flip DNS A/AAAA at low-traffic window.
5. Monitor `/healthz`, `ai_usage` error rate, Stripe webhook 200s for 60 min.

### Rollback plan

- **App rollback**: symlink to previous SHA + `touch tmp/restart.txt` (≤ 30 s).
- **DNS rollback**: revert A/AAAA records (propagation ≤ 5 min at TTL 300).
- **AI rollback**: set `AI_KILL_SWITCH=true` in cPanel + restart → consumers receive `503 ai_disabled` and surface friendly UI message.
- **DB**: no schema rollback required — only additive `ai_usage` migration; `drop table public.ai_usage cascade;` if absolutely necessary.

---

**Preservation confirmation under Phase 1:**

✅ SSR · ✅ SEO · ✅ AEO · ✅ GEO · ✅ AIO · ✅ Dynamic Sitemap · ✅ robots.txt · ✅ llms.txt · ✅ Authentication · ✅ Authorization (RLS) · ✅ createServerFn · ✅ API Routes · ✅ Payments · ✅ Webhooks · ✅ AI Platform · ✅ RAG · ✅ Knowledge Graph · ✅ Analytics readiness · ✅ Search Console readiness · ✅ Future scalability

No migration performed. Ready for execution on your authorization.
