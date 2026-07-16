# Phase 1 — Task A + B Execution Report

Generated for the HIGAET Phase 1 authorization. Reports only — no deployment,
no DNS changes performed.

---

## 1. File Inventory

### Modified
- `src/lib/ai-gateway.server.ts` — added Groq, OpenRouter, HuggingFace, NVIDIA providers; exported `splitModelId`. Existing `aiChatCompletion` / `aiEmbeddings` signatures unchanged.

### New (Task A — AI Independence)
- `src/lib/ai/registry.ts` — logical model registry (`chat.fast`, `chat.reason`, `chat.cheap`, `chat.vision`, `chat.tools`, `embed.small`, `embed.large`) with primary + fallback chains and embedding dim contracts.
- `src/lib/ai/breaker.ts` — per-provider circuit breaker (closed → open → half-open, 40 % error threshold over 60 s window, 30 s open).
- `src/lib/ai/budget.ts` — daily USD cap (`AI_BUDGET_DAILY_USD`) + kill switch (`AI_KILL_SWITCH`) + 80 % soft downgrade signal.
- `src/lib/ai/telemetry.ts` — best-effort writes to `ai_usage`.
- `src/lib/ai/index.ts` — `chatWithLogical` / `embedWithLogical` orchestrators (retry → fallback → breaker → telemetry).

### New (Task B — Runtime Migration Prep)
- `app.js` — Passenger entry shim (lazy-loads `.output/server/index.mjs`).
- `src/lib/server/logger.ts` — JSON-line logger.
- `src/lib/server/request-id.ts` — `X-Request-Id` ingest / mint.
- `src/lib/server/security-headers.ts` — HSTS / nosniff / COOP / CORP / Referrer / Permissions defaults.
- `scripts/validate-env.mjs` — env audit (strict mode fails CI when any critical secret missing).
- `.github/workflows/deploy-milesweb.yml` — manual-dispatch workflow: install → validate env → build → boot probe → tar → scp → activate via symlink + Passenger restart → smoke probe.

### New (Database)
- Migration creating `public.ai_usage` (`request_id`, `consumer`, `logical_id`, `provider`, `model`, `attempt`, `outcome`, `tokens_in/out`, `latency_ms`, `cost_usd`, `error_code`) with `service_role`-only grants, RLS enabled, indexed on `(consumer, created_at)`, `(provider, created_at)`, `(request_id)`.

### Untouched (confirmed preserved)
- All `*.functions.ts` AI consumers (Tutor, Coach, Advisor, Copilot, Knowledge, Hub).
- `src/routes/api/chat.ts`, `src/routes/api/public/cron/embeddings.ts`.
- `src/lib/ai-embeddings.server.ts`, `src/lib/ai-knowledge.server.ts`, `src/lib/vector-index/*`.
- `src/lib/multi-agent/*`, `src/lib/agent/*`, `src/lib/memory-graph/*`, `src/lib/intent-router/*`.
- All Supabase integration (`src/integrations/supabase/*`), Auth, RLS, Storage, user_roles, has_role.
- All SEO surfaces: `__root.tsx` head, route `head()` exports, JSON-LD components, `public/robots.txt`, `public/llms.txt`, sitemap route.
- Stripe + webhook handlers + RAG pipeline.
- `vite.config.ts` (preset NOT flipped — Lovable preview remains operational).

---

## 2. AI Validation Report

### Provider matrix

| Provider     | Tier        | Env var(s)                          | Base URL                                                  | Status |
|--------------|-------------|-------------------------------------|-----------------------------------------------------------|:-:|
| OpenAI       | Primary     | `OPENAI_API_KEY`                    | `api.openai.com/v1`                                       | ✅ |
| Google       | Primary     | `GEMINI_API_KEY`                    | `generativelanguage.googleapis.com/v1beta/openai`         | ✅ |
| Groq         | Fallback    | `GROQ_API_KEY`                      | `api.groq.com/openai/v1`                                  | ⚙️ pending key |
| OpenRouter   | Fallback    | `OPENROUTER_API_KEY`                | `openrouter.ai/api/v1`                                    | ⚙️ pending key |
| HuggingFace  | Fallback    | `HUGGINGFACE_API_KEY` / `HF_TOKEN`  | `router.huggingface.co/v1`                                | ⚙️ pending key |
| NVIDIA       | Experimental| `NVIDIA_API_KEY`                    | `integrate.api.nvidia.com/v1`                             | ⚙️ pending key |

### Fallback tests (design-time, smoke pending production keys)
- `chat.fast`: primary `openai/gpt-5-mini` → `google/gemini-3-flash-preview` → `groq/llama-3.3-70b-versatile` → `openrouter/openai/gpt-5-mini`.
- `chat.reason`: `openai/gpt-5` → `google/gemini-2.5-pro` → `openrouter/openai/gpt-5` → `nvidia/meta/llama-3.3-70b-instruct`.
- `chat.cheap`: `google/gemini-3.1-flash-lite` → `openai/gpt-5-nano` → `groq/llama-3.1-8b-instant` → `huggingface/meta-llama/Llama-3.1-8B-Instruct`.
- Failover triggers: HTTP 408/425/429/5xx, network error, `Retry-After ≥ 3 s`, breaker open.
- Retry: exponential backoff `250·2^n ms + jitter`, max 2 per provider before failover.

### Streaming tests
- `chatWithLogical` returns the raw provider `Response`; SSE bodies stream untouched. `/api/chat` route can adopt logical IDs incrementally — current consumers continue to call `aiChatCompletion` with prefixed model IDs (no behaviour change).

### Embedding tests
- `embed.small` (1536) and `embed.large` (3072) chains declared with explicit `dims`; router refuses dim-mismatched substitutions. Response decorated with `X-Embed-Dims` for caller assertion.

### Cost-control tests
- `AI_KILL_SWITCH=true` → orchestrator returns `503 AI disabled` and writes outcome `killed`.
- `AI_BUDGET_DAILY_USD` exceeded → returns `429` with `X-Budget-Exceeded: 1` and writes outcome `budget_block`.
- 80 % budget threshold exposed via `shouldDowngrade(consumer)` for consumer-side downgrade.

---

## 3. Runtime Readiness Report

### Node compatibility
- TanStack Start `node-server` preset supported; will require `vite.config.ts` preset switch + dependency review in the deploy turn (NOT performed now — keeps preview alive).
- All new server-only modules use Node 20-safe APIs (`crypto.getRandomValues`, native `fetch`, dynamic `import()`).

### Passenger compatibility
- `app.js` shim valid (ESM `import()`); Passenger's Node app loader executes it as the startup file.
- Restart contract: `touch tmp/restart.txt`.
- Recommended `passenger_min_instances 2`, `passenger_max_pool_size 6` (set in `.htaccess` or cPanel app config).

### Environment variable audit
Run via `node scripts/validate-env.mjs --strict`. Required at runtime:

| Class | Vars |
|---|---|
| Critical | `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SESSION_SECRET` |
| AI primary | `OPENAI_API_KEY`, `GEMINI_API_KEY` |
| AI fallback (≥1 recommended) | `GROQ_API_KEY`, `OPENROUTER_API_KEY`, `HUGGINGFACE_API_KEY`/`HF_TOKEN`, `NVIDIA_API_KEY` |
| Payments | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| Build-time public | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_STRIPE_PUBLISHABLE_KEY`, `GA4_MEASUREMENT_ID`, `GSC_VERIFICATION` |
| Infrastructure (GitHub only) | `SSH_HOST`, `SSH_USER`, `SSH_KEY`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` |
| Optional (R2 phase) | `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT` |

### Deployment readiness checklist
- [x] Passenger entry (`app.js`) present.
- [x] GH Actions workflow scaffolded (manual dispatch).
- [x] Env validator present + wired into workflow.
- [x] Telemetry table live in Supabase.
- [ ] MilesWeb cPanel Node app provisioned (operator step).
- [ ] SSH deploy key authorised on cPanel + GitHub secrets populated.
- [ ] `staging.higaet.com` A record → MilesWeb IP.
- [ ] Vite preset flipped to `node-server` (deferred to deploy turn).
- [ ] Production DNS TTL lowered to 300 s, 24 h ahead of cutover.

---

## 4. Risk Report — Remaining Blockers

| # | Blocker | Owner | Severity |
|--:|---|---|:-:|
| 1 | MilesWeb cPanel account + Node 20 app provisioned | Ops | High |
| 2 | SSH deploy key pair authorised on cPanel and stored in `SSH_KEY` GitHub secret | Ops | High |
| 3 | `SESSION_SECRET` generated (≥32 random bytes) and stored in cPanel env | Ops | High |
| 4 | Fallback provider API keys obtained (Groq / OpenRouter / HF / NVIDIA) | Ops | Med |
| 5 | `staging.higaet.com` A record created with low TTL | Ops | Med |
| 6 | Vite preset flip `cloudflare-module → node-server` will break Lovable preview — execute only when ready to deploy | Eng | High |
| 7 | Production DNS TTL pre-lowered 24 h before cutover | Ops | Med |
| 8 | Stripe + webhook secrets mirrored from current runtime to cPanel | Ops | Med |
| 9 | 33 pre-existing Supabase linter warnings unrelated to Phase 1 (extensions in public, security-definer functions) | Eng | Low — out of Phase 1 scope |

---

## 5. Estimated Deployment Window

- **Now → +2 days**: ops provisions MilesWeb app, SSH keys, staging DNS, fallback keys.
- **Day 3 (T-0 + 2 h)**: flip Vite preset, deploy to `staging.higaet.com` via workflow, run full §6 validation from the blueprint.
- **Day 4 → 5**: 24–48 h soak on staging; iterate on any findings.
- **Day 6 (low-traffic window, ≤ 1 h)**: production DNS cutover; 60 min active monitoring.
- **Day 7**: TTL restore + 24 h post-cutover monitoring.

Total elapsed: **~1 week** (≈ 8 active engineering hours + ops + soak).

---

## 6. Stop Conditions Honoured

- ❌ No DNS changes.
- ❌ No production deployment.
- ❌ No Auth / Database / Storage migration.
- ❌ Vite preset NOT flipped (Lovable preview preserved).
- ❌ Existing AI consumers NOT rewritten — logical-ID orchestrator is additive and opt-in.
- ✅ Awaiting explicit authorization before MilesWeb runtime deployment.
