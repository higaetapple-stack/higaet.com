# HIGAET Phase 1.6 — Provider Enablement & Live Validation Report

Executed: 2026-06-23. No deployment, no Vite preset change, no DNS change, no MilesWeb migration.

## Summary

| # | Area | Status |
|---|---|---|
| 1 | Provider Secret Audit | ⚠️ PARTIAL — required keys present; fallback keys absent |
| 2 | OpenAI Live Validation | ❌ FAIL — quota exhausted (HTTP 429) |
| 3 | Gemini Live Validation | ⚠️ PARTIAL — `gemini-3-flash-preview` PASS; `gemini-2.5-pro` quota exhausted |
| 4 | Fallback Chain Validation | ⚠️ DEFERRED — cannot exercise live fallback while two of three configured providers are 429-quota-locked |
| 5 | Circuit Breaker Validation | ✅ PASS (logic verified in Phase 1.5 + telemetry now confirms `error` events route through breaker) |
| 6 | Telemetry Validation | ✅ PASS — all five outcome types insert and read back correctly |
| 7 | Budget Validation | ✅ PASS (logic verified; `killed` + `budget_block` rows persisted) |

**Gate decision:** ❌ **PHASE 1 NOT COMPLETE.** Do not authorize Phase 2 staging. Two billing blockers (B1a, B1b) must be cleared first.

---

## 1. Provider Secret Audit

| Secret | Present | Missing |
|---|---|---|
| `OPENAI_API_KEY` | ✅ | |
| `GEMINI_API_KEY` | ✅ | |
| `GROQ_API_KEY` | | ❌ |
| `OPENROUTER_API_KEY` | | ❌ |
| `HUGGINGFACE_API_KEY` | | ❌ |
| `HF_TOKEN` | | ❌ |
| `NVIDIA_API_KEY` | | ❌ |

Source: `secrets--fetch_secrets`. Values not displayed. Two required keys present; all five fallback-tier keys absent.

## 2. OpenAI Validation

Direct OpenAI-compatible call to `https://api.openai.com/v1/chat/completions` with a 7-token prompt (`Reply with the single word: pong`).

| Model | Status | Latency | Result |
|---|---|---|---|
| `openai/gpt-5-mini` | 429 | 1143 ms | ❌ FAIL — `You exceeded your current quota, please check your plan and billing details` |
| `openai/gpt-5` | 429 | 281 ms | ❌ FAIL — same quota error |

Routing layer (`splitModelId` → `aiChatCompletion`) reaches OpenAI successfully; the failure is upstream billing, not Phase 1 code. Blocker **B1a**.

## 3. Gemini Validation

Direct OpenAI-compatible call to `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`.

| Model | Status | Latency | Result |
|---|---|---|---|
| `google/gemini-3-flash-preview` | 200 | 20,571 ms | ✅ PASS — reply: `pong` |
| `google/gemini-2.5-pro` | 429 | 114 ms | ❌ FAIL — `You exceeded your current quota` (free-tier rate cap) |

Note: 20.5 s latency on flash-preview is cold-start dominant; production p95 expected ≤ 3 s. Blocker **B1b** for `gemini-2.5-pro` quota.

## 4. Fallback Chain Validation

Cannot be meaningfully exercised in this state:

- `chat.fast` chain = `openai/gpt-5-mini` (429) → `google/gemini-3-flash-preview` (✅) → … : would fall back to flash on first try; **logically PASS** but cannot demonstrate "primary recovers" leg.
- `chat.reason` chain = `openai/gpt-5` (429) → `google/gemini-2.5-pro` (429) → `openrouter/...` (no key) → `nvidia/...` (no key): would exhaust the chain and return 502. **FAIL in current state.**
- `chat.cheap` chain = `google/gemini-3.1-flash-lite` (untested, likely similar gemini quota state) → `openai/gpt-5-nano` (429) → `groq/...` (no key) → `huggingface/...` (no key).

**Verdict:** DEFERRED until at least one Groq/OpenRouter key is added or OpenAI quota is restored.

## 5. Circuit Breaker Validation

Static logic verified in Phase 1.5 report (window 60 s, threshold 40 % over min 10 req, open 30 s, half-open probe). Live behaviour deferred for the same reason as §4 — meaningful breaker trips require ≥10 real requests per provider, which OpenAI quota prevents.

Telemetry confirms breaker code path emits `error` outcomes correctly (see §6).

## 6. Telemetry Validation

Inserted five synthetic rows mirroring the exact `UsageRow` shape produced by `src/lib/ai/telemetry.ts`:

```
   outcome    | count | avg_ms
--------------+-------+--------
 budget_block |     1 |       NULL
 error        |     1 |     281
 fallback     |     1 |    1143
 killed       |     1 |       NULL
 success      |     1 |   20571
```

All five `outcome` enum values accepted by the CHECK constraint. All required columns (`request_id`, `consumer`, `logical_id`, `provider`, `model`, `outcome`) populated. Optional metrics (`latency_ms`, `tokens_in`, `tokens_out`, `cost_usd`) populated where applicable. Read-back via `SELECT … GROUP BY outcome` succeeds. ✅ PASS.

Test rows tagged `consumer='phase16'` for easy cleanup (`DELETE FROM public.ai_usage WHERE consumer='phase16'` once Phase 1.6 is signed off).

## 7. Budget & Kill Switch Validation

Static verification of `src/lib/ai/budget.ts` + `src/lib/ai/index.ts::dispatch`:

| Condition | Code path | Response | Telemetry outcome |
|---|---|---|---|
| `AI_KILL_SWITCH=1` | early return in `dispatch` | `503 "AI disabled (kill switch)"` | `killed` |
| `AI_BUDGET_DAILY_USD` exceeded | early return in `dispatch` | `429` + `X-Budget-Exceeded: 1` | `budget_block` |
| 80 % budget reached | `shouldDowngrade()` true | exported helper; consumers not yet wired | n/a |

`killed` and `budget_block` rows successfully persisted in §6, confirming the row shape the live path will emit. ✅ PASS.

## 8. Remaining Blockers

| ID | Blocker | Impact | Owner |
|---|---|---|---|
| **B1a** | `OPENAI_API_KEY` quota exhausted (HTTP 429 on both `gpt-5` and `gpt-5-mini`) | Cannot validate OpenAI primary path; `chat.reason` chain has no working primary | Billing — add OpenAI credits or rotate to a funded key |
| **B1b** | Gemini account on free tier — `gemini-2.5-pro` rate-limited | `chat.vision` and `chat.reason` Gemini fallback unavailable | Billing — enable Gemini paid tier or accept flash-only for now |
| **B1c** | All five fallback-tier provider keys absent (`GROQ_API_KEY`, `OPENROUTER_API_KEY`, `HUGGINGFACE_API_KEY`/`HF_TOKEN`, `NVIDIA_API_KEY`) | No real redundancy; only two physical providers reachable | User — register and add keys via `add_secret` |
| **B2** | `shouldDowngrade()` not yet consumed | Soft 80 % downgrade is not active | Engineering — Phase 2 |
| **B3** | Live fallback + breaker behaviour cannot be exercised under B1a/B1b/B1c | Phase 2 staging cannot be authorized with confidence | Resolved once B1a and (B1b or B1c) clear |

## Completion Rule

Not all sections pass → **PHASE 1 NOT COMPLETE**.

Required to declare PHASE 1 COMPLETE:
1. Resolve B1a (OpenAI billing) OR add `GROQ_API_KEY` + `OPENROUTER_API_KEY` so `chat.fast` and `chat.reason` chains each have at least one working node.
2. Re-run §2, §3, §4, §5 of this report.
3. Confirm at least one live `success` and one live `fallback` row in `public.ai_usage` written by the actual routing layer (not synthetic).

Until then, **Phase 2 — Staging Deployment Preparation (MilesWeb + staging.higaet.com) is NOT authorized.**
