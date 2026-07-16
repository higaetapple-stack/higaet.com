# HIGAET Phase 1.5 Validation Plan

Status: **Pending execution** — no deployment, no preset migration, no DNS changes, no production cutover until all five deliverables below are completed and reviewed.

Scope guardrails (re-affirmed):
- Task Group A (AI Independence) and Task Group B (Runtime Prep) remain as additive scaffolding only.
- `vite.config.ts` preset stays on the current Lovable target.
- All existing AI consumers (`ai-advisor`, `ai-coach`, `ai-copilot`, `ai-tutor`, `ai-knowledge`, embeddings cron) continue to route through `ai-gateway.server.ts` with current model IDs.
- No production secrets rotated, no DNS records modified.

---

## Deliverable 1 — Provider Validation Report

**Goal:** Prove each non-Lovable provider in `src/lib/ai/registry.ts` responds correctly through the orchestration layer (registry → router → breaker → telemetry).

**Method:**
1. Add provider keys (when available) to dev env only: `OPENAI_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY`, `HF_API_KEY`, `NVIDIA_API_KEY`.
2. Run smoke test (script: `scripts/ai/validate-providers.mjs` — to be authored) that calls each logical model once with a fixed prompt:
   - `chat.fast` → Groq llama-3.3-70b
   - `chat.reason` → OpenAI gpt-5.4
   - `chat.cheap` → Gemini 2.5 flash
   - `chat.vision` → Gemini 2.5 flash (image input)
   - `chat.tools` → OpenAI gpt-5.4 (tool-call echo)
   - `embed.small` → OpenAI text-embedding-3-small (1536d)
   - `embed.large` → OpenAI text-embedding-3-large (3072d)
3. Capture: status, latency p50/p95, token counts, cost, breaker state.

**Acceptance:** 100% success on primaries; documented fallback path exercised at least once per logical id.

**Output:** `docs/infrastructure/reports/provider-validation.md` with the table above + raw JSON in `docs/infrastructure/reports/data/providers.json`.

---

## Deliverable 2 — Embedding Compatibility Report

**Goal:** Confirm dim-mismatch guards prevent pgvector corruption when switching embedding providers.

**Method:**
1. Inventory existing `ai_chunks.embedding` column dim (currently `vector(1536)` per migration) and the `embed.small` registry binding.
2. Test cases:
   - Insert via `embed.small` (1536) → expect success.
   - Attempt insert via `embed.large` (3072) → expect rejection by registry guard before SQL.
   - Re-embed sample of 50 existing chunks with each candidate provider; cosine similarity drift vs. baseline.
3. Drift threshold: mean cosine similarity to baseline ≥ 0.95 for "same provider, same model" reruns; report-only for cross-provider.

**Acceptance:** Guard rejects mismatched dims; no silent truncation; drift documented per provider.

**Output:** `docs/infrastructure/reports/embedding-compatibility.md` + `data/embedding-drift.csv`.

---

## Deliverable 3 — AI Cost Validation Report

**Goal:** Validate the `ai_usage` telemetry + `budget.ts` daily cap against real per-token pricing for each provider.

**Method:**
1. Encode authoritative per-1K-token prices in `src/lib/ai/pricing.ts` (to be added — data only, no behavior change).
2. Run 24h shadow window using current Lovable AI Gateway traffic; mirror request metadata into `ai_usage` with each candidate provider's price applied.
3. Produce per-consumer projection: `advisor`, `coach`, `copilot`, `tutor`, `knowledge`, `embeddings-cron`.

**Acceptance:**
- Projected monthly spend per consumer within ±10% across two consecutive 24h windows.
- Daily kill-switch threshold values proposed per consumer (USD/day).
- Identification of any consumer whose Gemini-cheap path is materially cheaper than current Lovable routing.

**Output:** `docs/infrastructure/reports/ai-cost-validation.md` + Looker-ready CSV.

---

## Deliverable 4 — HIGAET Logical Model Expansion

**Goal:** Extend the registry to cover HIGAET-specific workloads beyond the generic seven IDs.

**Proposed additions (planning only — implement after sign-off):**

| Logical ID | Primary | Fallback chain | Consumer |
|---|---|---|---|
| `academy.tutor.long` | OpenAI gpt-5.4 | Gemini 2.5 pro → Groq llama-3.3-70b | Academy AI Tutor (course-length context) |
| `academy.coach.fast` | Groq llama-3.3-70b | Gemini 2.5 flash | Career Coach realtime chat |
| `globaledu.advisor.reason` | OpenAI gpt-5.4 | Gemini 2.5 pro | Study-abroad advisor (visa/policy reasoning) |
| `globaledu.translate` | Gemini 2.5 flash | OpenAI gpt-5-mini | Multilingual lead intake |
| `tech.copilot.tools` | OpenAI gpt-5.4 | Gemini 2.5 pro | Internal ops copilot (tool calling) |
| `rag.embed.docs` | OpenAI text-embedding-3-small | Gemini embedding-001 (1536d truncated) | Knowledge base ingestion |
| `rag.embed.query` | OpenAI text-embedding-3-small | same as above | Query-time embedding (must match docs) |

Constraints:
- `rag.embed.docs` and `rag.embed.query` MUST share dimensionality; switching one requires re-embedding the corpus.
- Each logical ID gets a budget line and a kill-switch tag.

**Output:** `docs/infrastructure/reports/logical-model-expansion.md` + draft patch to `src/lib/ai/registry.ts` held in a feature branch (not merged).

---

## Deliverable 5 — AI Operations Dashboard

**Goal:** Surface telemetry from `ai_usage` to operators without exposing raw service-role data.

**Scope:**
- Route: `src/routes/_authenticated/admin/ai-ops.tsx` (admin-only via `has_role` check).
- Server fn: `src/lib/ai-ops.functions.ts` with `requireSupabaseAuth` + admin check, aggregates last 24h / 7d / 30d.
- Panels: requests/min, success vs. error, p50/p95 latency, tokens in/out, USD cost by consumer, breaker state per provider, kill-switch status.
- Data source: read-only from `ai_usage`; no PII; truncate prompts.

**Acceptance:** Dashboard renders for `admin` role only; non-admin gets 403; query cost ≤ 200ms p95 on 30-day window with 100k rows (index on `(consumer, created_at)` may be needed).

**Output:** `docs/infrastructure/reports/ai-ops-dashboard-spec.md` + draft route/fn under feature branch (not merged).

---

## Execution Order

1. D1 Provider Validation (blocking — needs keys)
2. D2 Embedding Compatibility (depends on D1)
3. D3 Cost Validation (depends on D1, can run in parallel with D2)
4. D4 Logical Model Expansion (depends on D1 + D3)
5. D5 Ops Dashboard (depends on D3 schema confirmation)

Estimated effort: ~18 engineering hours + 48h shadow window for D3.

## Blockers

- Provider API keys (OpenAI, Gemini, Groq, OpenRouter, HF, NVIDIA) for dev environment.
- Confirmation of pgvector column dimensions across all embedding-bearing tables.
- Admin role assignments in `user_roles` for at least one validation account.

## Gate to Staging

Staging deployment authorization may only be requested after all five deliverables are produced, reviewed, and explicitly approved. Until then:

- ❌ No MilesWeb deployment
- ❌ No Vite preset migration
- ❌ No DNS changes
- ❌ No production cutover
