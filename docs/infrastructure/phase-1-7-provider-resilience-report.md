# HIGAET Phase 1.7 — Provider Resilience Unblock Report

Planning & validation only. No runtime code modified. No deployment, no DNS change, no Vite preset change, no MilesWeb migration.

## 1. Provider Inventory

Current state (from `src/lib/ai/registry.ts` + Phase 1.6 live results):

Working-node legend:
- ✅ `google/gemini-3-flash-preview` (live PASS)
- ❌ `openai/gpt-5`, `openai/gpt-5-mini`, `openai/gpt-5-nano` (B1a — quota 429)
- ❌ `google/gemini-2.5-pro`, `google/gemini-3.1-flash-lite` (Gemini paid tier not enabled — 429)
- ❌ `groq/*`, `openrouter/*`, `huggingface/*`, `nvidia/*` (B1b — no API keys)

| Logical Model | Primary | Fallbacks | Working Nodes | Risk |
|---|---|---|---:|---|
| `chat.fast` | `openai/gpt-5-mini` ❌ | `google/gemini-3-flash-preview` ✅, `groq/llama-3.3-70b-versatile` ❌, `openrouter/openai/gpt-5-mini` ❌ | **1** | 🟡 YELLOW |
| `chat.reason` | `openai/gpt-5` ❌ | `google/gemini-2.5-pro` ❌, `openrouter/openai/gpt-5` ❌, `nvidia/meta/llama-3.3-70b-instruct` ❌ | **0** | 🔴 RED |
| `chat.cheap` | `google/gemini-3.1-flash-lite` ❌ | `openai/gpt-5-nano` ❌, `groq/llama-3.1-8b-instant` ❌, `huggingface/meta-llama/Llama-3.1-8B-Instruct` ❌ | **0** | 🔴 RED |
| `chat.vision` | `google/gemini-2.5-pro` ❌ | `openai/gpt-5` ❌ | **0** | 🔴 RED |
| `chat.tools` | `openai/gpt-5-mini` ❌ | `google/gemini-3-flash-preview` ✅ | **1** | 🟡 YELLOW |
| `embed.small` (1536d) | `openai/text-embedding-3-small` ❌ | `huggingface/BAAI/bge-small-en-v1.5` ❌ | **0** | 🔴 RED |
| `embed.large` (3072d) | `openai/text-embedding-3-large` ❌ | `google/gemini-embedding-001` ❓ (untested; same Gemini quota state) | **0–1** | 🔴 RED |

**Verdict:** 5/7 chains RED, 2/7 YELLOW, 0/7 GREEN. Production cutover is unsafe.

---

## 2. OpenRouter Readiness

OpenRouter is an OpenAI-compatible aggregator at `https://openrouter.ai/api/v1`.

| Check | Status | Notes |
|---|---|---|
| Routing compatibility | ✅ | `splitModelId` already recognises `openrouter/` prefix; base URL wired in `PROVIDER_BASE` |
| Auth compatibility | ✅ | Bearer-token in `Authorization` header; matches existing `aiChatCompletion`/`aiEmbeddings` shape |
| Telemetry compatibility | ✅ | `provider="openrouter"` plus underlying model captured in `model` column; no schema change required |
| Fallback compatibility | ✅ | Chain-walker in `dispatch()` is provider-agnostic |
| Embeddings | ⚠️ | OpenRouter `/embeddings` exists but model coverage is thinner than OpenAI/Gemini; prefer it for chat fallback only |
| Rate limits | ⚠️ | Per-key default ~20 rpm on free credits; paid balance lifts caps |
| Cost note | OpenRouter passes upstream pricing + ~5 % margin; cheap as a unifying fallback |

**Action when ready:** add `OPENROUTER_API_KEY` via `secrets--add_secret`; no code change required. Validate with a single round-trip to `openrouter/openai/gpt-5-mini` and `openrouter/google/gemini-3-flash-preview`.

---

## 3. Groq Readiness

Groq exposes an OpenAI-compatible API at `https://api.groq.com/openai/v1`.

| Check | Status | Notes |
|---|---|---|
| Routing compatibility | ✅ | `groq/` prefix already in `PROVIDER_BASE` |
| Auth compatibility | ✅ | Bearer-token header |
| Latency expectations | ✅ | p50 200–600 ms for llama-3.3-70b; fastest inference of any configured fallback |
| Model coverage | ⚠️ | Chat only; **no embeddings endpoint** — Groq cannot serve `embed.*` chains |
| Telemetry compatibility | ✅ | No schema change |
| Fallback compatibility | ✅ | Chain-walker compatible |
| Cost | ✅ | ~$0.59/M input · $0.79/M output for llama-3.3-70b — cheapest viable fallback for `chat.fast` and `chat.cheap` |
| Free tier | ✅ | 14k req/day on free tier is sufficient for staging validation |

**Action when ready:** add `GROQ_API_KEY`. Validate with `groq/llama-3.3-70b-versatile` and `groq/llama-3.1-8b-instant`.

---

## 4. Recommended Chain Matrix

Goals: ≥2 providers per chain, ≥1 non-OpenAI node, ≥1 non-Google node (where the workload permits — embeddings constrained by dim compatibility).

| Logical Model | Recommended Primary | Recommended Fallback Chain | Providers (≥2) | non-OpenAI | non-Google |
|---|---|---|---|---|---|
| `chat.fast` | `groq/llama-3.3-70b-versatile` | `google/gemini-3-flash-preview` → `openai/gpt-5-mini` → `openrouter/meta-llama/llama-3.3-70b-instruct` | 4 | ✅ Groq+Gemini+OR | ✅ Groq+OpenAI+OR |
| `chat.reason` | `openai/gpt-5` | `google/gemini-2.5-pro` → `openrouter/anthropic/claude-3.7-sonnet` → `groq/llama-3.3-70b-versatile` | 4 | ✅ Gemini+OR+Groq | ✅ OpenAI+OR+Groq |
| `chat.cheap` | `groq/llama-3.1-8b-instant` | `google/gemini-3-flash-preview` → `openai/gpt-5-nano` → `openrouter/meta-llama/llama-3.1-8b-instruct` | 4 | ✅ | ✅ |
| `chat.vision` | `google/gemini-2.5-pro` | `openai/gpt-5` → `openrouter/anthropic/claude-3.7-sonnet` | 3 | ✅ OR | ✅ OpenAI+OR |
| `chat.tools` | `openai/gpt-5-mini` | `google/gemini-3-flash-preview` → `openrouter/openai/gpt-5-mini` | 3 | ✅ Gemini+OR | ✅ OpenAI+OR |
| `embed.small` (1536d) | `openai/text-embedding-3-small` | `openrouter/openai/text-embedding-3-small` | 2 | ⚠️ both OpenAI-family | ✅ |
| `embed.large` (3072d) | `openai/text-embedding-3-large` | `google/gemini-embedding-001` (3072d) → `openrouter/openai/text-embedding-3-large` | 3 | ✅ Gemini+OR | ✅ OpenAI+OR |

Notes:
- `embed.small` cannot be made dimension-compatible across providers without re-embedding the corpus; OpenRouter passthrough is the safest "second provider" since dims are identical.
- Anthropic via OpenRouter is the cheapest way to add a third provider family without managing another vendor relationship.
- Groq is intentionally absent from embedding chains (no embedding endpoint).

---

## 5. Staging Readiness Forecast

### Scenario A — OpenAI billing restored, no other change

| Logical Model | Status | Notes |
|---|---|---|
| `chat.fast` | ✅ PASS | OpenAI primary + Gemini-flash fallback |
| `chat.reason` | ⚠️ PARTIAL | OpenAI works; Gemini 2.5 pro still 429; no third node |
| `chat.cheap` | ⚠️ PARTIAL | OpenAI nano works; Gemini flash-lite still 429 |
| `chat.vision` | ⚠️ PARTIAL | OpenAI vision works; Gemini fallback still 429 |
| `chat.tools` | ✅ PASS | Both nodes working |
| `embed.small` | ✅ PASS | OpenAI primary works |
| `embed.large` | ⚠️ PARTIAL | OpenAI primary works; no real fallback |

- **Staging readiness:** ~65 %.
- **Remaining blockers:** no redundancy on Gemini-paid; single-provider risk on 4 chains.
- **Verdict:** Acceptable for staging soak with feature-flagged consumers; **not** acceptable for production cutover.

### Scenario B — OpenAI down, Groq + OpenRouter available

| Logical Model | Status | Notes |
|---|---|---|
| `chat.fast` | ✅ PASS | Groq primary + Gemini-flash + OpenRouter |
| `chat.reason` | ✅ PASS | OpenRouter (gpt-5 / claude) + Groq llama-3.3 fallback |
| `chat.cheap` | ✅ PASS | Groq 8b + Gemini-flash + OpenRouter |
| `chat.vision` | ⚠️ DEGRADED | Only Gemini-flash supports vision in our reachable set; pro still 429 → no fallback unless OpenRouter Claude added |
| `chat.tools` | ✅ PASS | Gemini-flash + OpenRouter |
| `embed.small` | ❌ FAIL | OpenAI 429 → OpenRouter passthrough also fails (same upstream) |
| `embed.large` | ⚠️ DEGRADED | Gemini embedding-001 only if paid tier; otherwise FAIL |

- **Staging readiness:** ~75 % (chat) / ~20 % (embeddings).
- **Remaining blockers:** embeddings have no non-OpenAI substitute at matching dims; vision needs Anthropic via OpenRouter.
- **Verdict:** Chat features can stage; RAG ingestion + query must be flagged off until OpenAI quota or Gemini paid tier is restored.

### Scenario C — Both OpenAI and Gemini unavailable, Groq + OpenRouter available

| Logical Model | Status |
|---|---|
| `chat.fast` | ✅ PASS — Groq + OpenRouter llama |
| `chat.reason` | ✅ PASS — OpenRouter Claude/GPT + Groq |
| `chat.cheap` | ✅ PASS — Groq |
| `chat.vision` | ❌ FAIL — only Anthropic Claude via OpenRouter supports image input in this set; must be explicitly added to chain |
| `chat.tools` | ⚠️ DEGRADED — OpenRouter only; tool-calling fidelity varies by underlying model |
| `embed.small` | ❌ FAIL — OpenRouter passthrough still hits OpenAI |
| `embed.large` | ❌ FAIL — same |

- **Staging readiness:** ~50 % (chat-only).
- **Remaining blockers:** embeddings are unsupportable without OpenAI or Gemini paid tier.
- **Verdict:** Not viable for any feature that touches RAG, KB ingestion, semantic search, or visual analysis. Acceptable only for chat-only staging smoke.

---

## 6. Remaining Blockers

| ID | Blocker | Severity | Resolution |
|---|---|---|---|
| **B1a** | OpenAI quota exhausted (HTTP 429) | 🔴 Critical | Restore billing / rotate to a funded `OPENAI_API_KEY` |
| **B1b-1** | `GROQ_API_KEY` missing | 🟠 High | `secrets--add_secret` after user creates Groq account |
| **B1b-2** | `OPENROUTER_API_KEY` missing | 🟠 High | `secrets--add_secret` after user creates OpenRouter account + adds credits |
| **B1b-3** | `HUGGINGFACE_API_KEY` / `HF_TOKEN` missing | 🟡 Medium | Optional — only enables `embed.small` HF fallback |
| **B1b-4** | `NVIDIA_API_KEY` missing | 🟢 Low | Optional — experimental fallback only |
| **B1c** | Gemini account on free tier (pro/flash-lite return 429) | 🟠 High | Enable Gemini paid tier OR accept flash-preview-only Gemini path |
| **B4** | Embedding chains have no real provider diversity at matching dims | 🟠 High | Either keep OpenAI as sole embedding vendor (accept risk) or commit to re-embedding the corpus when switching |
| **B5** | `chat.vision` has only one healthy node in every scenario except A | 🟡 Medium | Add `openrouter/anthropic/claude-3.7-sonnet` to `chat.vision` chain |

---

## Minimum Provider Configuration to Begin Phase 2 Staging

The smallest set that takes every chat chain to GREEN and every embedding chain to at-least-YELLOW:

1. **Restore `OPENAI_API_KEY` billing** (resolves B1a + unblocks both embedding chains).
2. **Add `GROQ_API_KEY`** (gives `chat.fast`, `chat.reason`, `chat.cheap` a fast, cheap, non-OpenAI/non-Google node).
3. **Add `OPENROUTER_API_KEY`** (gives every chat chain a third independent provider + opens Anthropic for `chat.vision`).
4. **Adopt the chain matrix in §4** (registry edit; no runtime logic change).
5. Re-run Phase 1.6 §2–§5 with the new keys; require at least one live `success` and one live `fallback` row in `public.ai_usage` per chain before staging authorization.

`HUGGINGFACE_API_KEY` and `NVIDIA_API_KEY` are **not** required for Phase 2 staging; defer to Phase 3.

---

## Next-step request from user

To proceed to Phase 1.8 (live validation of the hardened chains), provide:

- Confirmation of OpenAI billing restoration, **or** authorization to proceed Scenario-B (chat-only staging with RAG features flagged off).
- Authorization to add `GROQ_API_KEY` and `OPENROUTER_API_KEY` via `secrets--add_secret`.
- Decision on Gemini paid tier (yes / defer).

No runtime code changes will be made until that authorization is received.
