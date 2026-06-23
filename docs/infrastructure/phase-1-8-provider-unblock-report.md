# HIGAET Phase 1.8 — Provider Unblock & Resilience Validation Report

Executed: 2026-06-23. Read-only validation. No code, deployment, DNS, or Vite preset changes.

## Summary

| Section | Status |
|---|---|
| 1. Environment Audit | ⚠️ 2/7 keys present |
| 2. Live Provider Validation | ❌ Only 1/5 reachable models returned 200 |
| 3. Fallback Validation | ⏭️ DEFERRED — cannot exercise multi-provider failover with one healthy node |
| 4. Circuit Breaker Validation | ⏭️ DEFERRED — same reason |
| 5. Registry Review | ✅ Recommended matrix produced |

**Phase 2 Recommendation: 🚫 NO-GO.**

---

## 1. Environment Audit

Source: `secrets--fetch_secrets` (values not displayed).

| Secret | Status | Notes |
|---|---|---|
| `OPENAI_API_KEY` | ✅ Present | Quota exhausted (see §2) |
| `GEMINI_API_KEY` | ✅ Present | Free-tier; mixed availability (see §2) |
| `GROQ_API_KEY` | ❌ Missing | Required to unblock |
| `OPENROUTER_API_KEY` | ❌ Missing | Required to unblock |
| `HUGGINGFACE_API_KEY` / `HF_TOKEN` | ❌ Missing | Optional |
| `NVIDIA_API_KEY` | ❌ Missing | Optional |

## 2. Live Provider Validation

Direct OpenAI-compatible ping (`Reply with one word: pong`).

| Logical Model ID | Provider | Status | Latency | Reply | Outcome |
|---|---|---:|---:|---|---|
| `openai/gpt-5-mini` | OpenAI | 429 | 377 ms | — | ❌ Quota exhausted |
| `openai/gpt-5` | OpenAI | 429 | 806 ms | — | ❌ Quota exhausted |
| `google/gemini-3-flash-preview` | Google | 503 | 1,575 ms | — | ⚠️ Upstream overload (transient) |
| `google/gemini-2.5-pro` | Google | 429 | 60 ms | — | ❌ Free-tier rate-limited |
| `google/gemini-3.1-flash-lite` | Google | 200 | 495 ms | `Ping` | ✅ PASS |
| `groq/*` | Groq | n/a | — | — | ⏭️ NO_KEY |
| `openrouter/*` | OpenRouter | n/a | — | — | ⏭️ NO_KEY |
| `huggingface/*` | HF | n/a | — | — | ⏭️ NO_KEY |
| `nvidia/*` | NVIDIA | n/a | — | — | ⏭️ NO_KEY |

Net reachable models: **1** (`google/gemini-3.1-flash-lite`).

Note: gemini-3-flash-preview returned 200 in Phase 1.6 and 503 today — confirms the model is real and reachable from this network, current failure is upstream demand spike, not a config issue.

## 3. Fallback Validation

| Chain | Result |
|---|---|
| `chat.fast` | ⏭️ DEFERRED — primary 429, only one live fallback node would absorb every request; not a real failover test |
| `chat.reason` | ⏭️ DEFERRED — 0 reachable nodes in chain |
| `chat.cheap` | ⚠️ PARTIAL — gemini-3.1-flash-lite (currently a fallback) would carry every request; primary unreachable |
| `chat.vision` | ⏭️ DEFERRED — 0 reachable nodes |
| `chat.tools` | ⏭️ DEFERRED — gemini-3-flash-preview currently 503; OpenAI 429 |
| `embed.small` | ⏭️ DEFERRED — OpenAI 429; no live fallback |
| `embed.large` | ⏭️ DEFERRED — OpenAI 429; Gemini embedding-001 untested but same paid-tier dependency as 2.5-pro |

Multi-provider fallover cannot be meaningfully validated until **at least one non-OpenAI/non-Google provider key is present**.

## 4. Circuit Breaker Validation

Static behaviour (60 s window, 10-req min, 40 % error threshold, 30 s open, half-open probe) is correct in `src/lib/ai/breaker.ts` and was telemetry-verified in Phase 1.6. A live trip requires ≥10 real requests per provider per minute, which OpenAI quota and the single-healthy-node state prevent. ⏭️ DEFERRED.

## 5. Registry Review — Recommended Production Chain Matrix

Constraints: ≥2 live providers per chain, ≥1 non-OpenAI node, ≥1 non-Google node where the workload permits.

| Logical Model | Recommended Primary | Fallback chain | SPOF? |
|---|---|---|---|
| `chat.fast` | `groq/llama-3.3-70b-versatile` | → `google/gemini-3.1-flash-lite` → `openai/gpt-5-mini` → `openrouter/meta-llama/llama-3.3-70b-instruct` | No |
| `chat.reason` | `openai/gpt-5` | → `openrouter/anthropic/claude-3.7-sonnet` → `google/gemini-2.5-pro` → `groq/llama-3.3-70b-versatile` | No |
| `chat.cheap` | `groq/llama-3.1-8b-instant` | → `google/gemini-3.1-flash-lite` → `openai/gpt-5-nano` → `openrouter/meta-llama/llama-3.1-8b-instruct` | No |
| `chat.vision` | `google/gemini-2.5-pro` | → `openai/gpt-5` → `openrouter/anthropic/claude-3.7-sonnet` | No |
| `chat.tools` | `openai/gpt-5-mini` | → `google/gemini-3-flash-preview` → `openrouter/openai/gpt-5-mini` | No |
| `embed.small` (1536d) | `openai/text-embedding-3-small` | → `openrouter/openai/text-embedding-3-small` | ⚠️ Both OpenAI-family (passthrough) |
| `embed.large` (3072d) | `openai/text-embedding-3-large` | → `google/gemini-embedding-001` → `openrouter/openai/text-embedding-3-large` | No, once Gemini paid tier is on |

**Single points of failure today** (until keys added): every chain except `chat.cheap` has zero or one live node.

## 6. Remaining Blockers

| ID | Blocker | Severity |
|---|---|---|
| **B1a** | `OPENAI_API_KEY` quota exhausted | 🔴 Critical |
| **B1b-1** | `GROQ_API_KEY` missing | 🟠 High |
| **B1b-2** | `OPENROUTER_API_KEY` missing | 🟠 High |
| **B1c** | Gemini account on free tier (pro / flash-preview unstable, 2.5-pro 429) | 🟠 High |
| **B4** | Embedding chains lack provider diversity at matching dims | 🟠 High |
| **B5** | `chat.vision` has 0 reachable nodes today | 🟡 Medium |

## 7. Phase 2 GO / NO-GO Recommendation

**🚫 NO-GO.**

Minimum unblock set to revisit:

1. Add `GROQ_API_KEY` — fastest, cheapest non-OpenAI/non-Google node; recovers `chat.fast` and `chat.cheap` immediately.
2. Add `OPENROUTER_API_KEY` — restores `chat.reason`, `chat.vision` (Claude), and gives every chain a third independent provider.
3. Either restore OpenAI billing **or** accept Scenario B (RAG/embedding features feature-flagged off in staging).

Once steps 1–2 are done, re-run Phase 1.8 §2–§4 with at least one live `success` and one live `fallback` row written to `public.ai_usage` per chain. Then — and only then — authorize Phase 2 staging deployment.

No runtime code, deployment, DNS, or Vite preset changes were made in this phase.
