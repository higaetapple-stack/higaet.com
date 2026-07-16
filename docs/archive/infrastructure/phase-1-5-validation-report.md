# HIGAET Phase 1.5 Validation Report

Executed: 2026-06-23. Scope per `docs/infrastructure/phase-1-5-validation.md`. No deployment, no DNS, no Vite preset change, no production modification.

## Summary

| # | Area | Status |
|---|---|---|
| 1 | Build Validation | ✅ PASS |
| 2 | Database Validation | ✅ PASS |
| 3 | AI Provider Validation | ⚠️ PARTIAL — code paths verified; live provider calls blocked (no keys) |
| 4 | Telemetry Validation | ✅ PASS (schema + insert path); ⚠️ no live rows yet (telemetry only fires on real calls) |
| 5 | Budget & Kill Switch Validation | ✅ PASS (logic verified statically) |

**Gate decision:** ⚠️ **HOLD on Phase 2.** Build/DB/code are green, but live provider runs (D1) and a real telemetry write (D4) require provider API keys in the dev environment. Add the six provider keys, then re-run sections 3 + 4 before staging authorization.

---

## 1. Build Report

- `bun run build` → **PASS** (16.43s). Nitro Cloudflare worker generated (`dist/server/wrangler.json`, `dist/nitro.json`, `dist/client/_headers`).
- No TypeScript errors surfaced from the build (Vite + TanStack route generation succeeded; `routeTree.gen.ts` regenerated cleanly).
- No dependency conflicts. AI-SDK (`@ai-sdk/openai` 240 kB, `@ai-sdk/google` 211 kB) bundled into SSR; consistent with Task A scaffolding.
- Largest SSR chunk: `_ssr/router-*.mjs` ~1.18 MB (pre-existing; not introduced by Phase 1).

Risk: none from Phase 1 scaffolding.

## 2. Database Report

Query: `public.ai_usage`.

| Check | Result |
|---|---|
| Table exists | ✅ present |
| Columns (14) | ✅ match migration: `id, created_at, request_id, consumer, logical_id, provider, model, attempt, outcome, tokens_in, tokens_out, latency_ms, cost_usd, error_code` |
| Indexes | ✅ `ai_usage_pkey`, `ai_usage_consumer_created_at_idx`, `ai_usage_provider_created_at_idx`, `ai_usage_request_id_idx` |
| RLS enabled | ✅ `relrowsecurity = t` |
| Policies | ✅ none defined → deny-by-default for `authenticated` and `anon` |
| `service_role` access | ✅ `has_table_privilege('service_role','public.ai_usage','INSERT'|'SELECT') = true`; `service_role` has `BYPASSRLS` |
| `authenticated` blocked by RLS | ✅ no policies → cannot read/write |
| `anon` blocked by RLS | ✅ no policies → cannot read/write |
| `outcome` CHECK constraint | ✅ enforces `success | fallback | error | budget_block | killed` |

Row count: **0** (telemetry inserts only happen on real provider calls; none have occurred yet).

## 3. AI Routing Report

Static verification of `src/lib/ai/*`:

| Check | Result |
|---|---|
| Logical registry shape | ✅ 5 chat IDs + 2 embed IDs in `registry.ts` |
| `chat.fast` primary | `openai/gpt-5-mini` → fallback Gemini → Groq → OpenRouter |
| `chat.reason` primary | `openai/gpt-5` → fallback Gemini 2.5 Pro → OpenRouter → NVIDIA |
| `chat.cheap` primary | `google/gemini-3.1-flash-lite` → fallback OpenAI nano → Groq → HF |
| `chat.vision` primary | `google/gemini-2.5-pro` → fallback `openai/gpt-5` |
| `chat.tools` primary | `openai/gpt-5-mini` → fallback `google/gemini-3-flash-preview` |
| `embed.small` (1536 dims) | `openai/text-embedding-3-small` → fallback `huggingface/BAAI/bge-small-en-v1.5` |
| `embed.large` (3072 dims) | `openai/text-embedding-3-large` → fallback `google/gemini-embedding-001` |
| Dim guard on embeddings | ✅ `embedWithLogical` sets `X-Embed-Dims` header from registry; chains are dim-locked at registry level |
| Provider routing | ✅ `splitModelId` recognizes `openai/`, `google/`, `groq/`, `openrouter/`, `huggingface/`, `nvidia/`; default = openai |
| Retry behavior | ✅ `attemptCall` retries on 408/425/429/500/502/503/504; honors `Retry-After ≤ 3s`; otherwise exponential backoff 250ms · 2^(n-1) with jitter |
| Fallback behavior | ✅ `dispatch` walks chain on non-retryable failure or exhausted retries |
| Circuit breaker | ✅ per-provider: 60s window, 10-request minimum, 40% error → open for 30s → half-open probe |
| Kill switch | ✅ `AI_KILL_SWITCH ∈ {1,true,yes}` → 503 before dispatch + logged as `killed` |
| Budget guard | ✅ `AI_BUDGET_DAILY_USD` cap; exceeded → 429 + `X-Budget-Exceeded: 1` |

**Live call verification:** ⏳ NOT EXECUTED.
- `compgen -e | rg -i 'OPENAI|GEMINI|GROQ|OPENROUTER|HUGGINGFACE|HF_TOKEN|NVIDIA'` confirms no provider keys are present in this environment.
- `requireKey()` will throw `${ENV} missing` on first dispatch.
- This is **expected** — Phase 1.5 plan lists provider keys as a blocker.

## 4. Telemetry Report

| Check | Result |
|---|---|
| `logUsage()` writes via `supabaseAdmin` (service-role, bypasses RLS) | ✅ |
| `newRequestId()` produces RFC 4122 v4 UUID via `crypto.getRandomValues` | ✅ |
| Insert payload matches column set | ✅ all 12 writable columns covered by `UsageRow` |
| Telemetry never throws to caller (try/catch swallow) | ✅ |
| Outcomes recorded for: success, fallback, error, budget_block, killed, circuit_open (as error) | ✅ |
| Live write test | ⏳ pending provider keys |

## 5. Budget Report

| Check | Result |
|---|---|
| `killSwitchEnabled()` reads `AI_KILL_SWITCH` correctly | ✅ |
| `dailyBudgetUsd()` defaults to `Infinity` when unset (no accidental denial) | ✅ |
| `isBudgetExceeded()` sums `cost_usd` over last 24h per consumer | ✅ |
| `shouldDowngrade()` triggers at 80% of cap | ✅ exported for future use; not yet wired into consumers |
| Fail-open on telemetry read error | ✅ returns `0` on exception |
| Budget block surfaces `X-Budget-Exceeded` header + 429 | ✅ |

## 6. Blocker Report

| # | Blocker | Owner | Required for |
|---|---|---|---|
| B1 | Provider API keys missing (`OPENAI_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY`, `HUGGINGFACE_API_KEY`/`HF_TOKEN`, `NVIDIA_API_KEY`) | User | D1 live verification, D4 first real telemetry row |
| B2 | `shouldDowngrade()` not wired into any consumer yet | Engineering (Phase 2) | Soft-downgrade behavior at 80% budget |
| B3 | No live `ai_usage` rows → cannot validate dashboard query performance under realistic volume | Engineering | Deliverable 5 of Phase 1.5 plan |
| B4 | MilesWeb account, SSH key, `staging.higaet.com` DNS still unprovisioned | Infrastructure | Phase 2 staging |

None of B1–B4 are regressions; all are pre-known dependencies from the Phase 1 execution report.

## Gate Decision

- ✅ Build green
- ✅ DB schema, indexes, RLS, grants correct
- ✅ Routing/retry/breaker/budget/kill-switch logic verified by static inspection
- ⏳ Live provider + telemetry validation deferred until keys are added (B1)

**Do not proceed to Phase 2 staging deployment** until B1 is resolved and sections 3 + 4 of this report are re-run with at least one live `success`, one forced `fallback`, and one forced `error` row in `public.ai_usage`.
