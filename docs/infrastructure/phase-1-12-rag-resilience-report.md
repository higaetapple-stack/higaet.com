# HIGAET Phase 1.12 — RAG Resilience Unblock

**Status:** ✅ **Path 2 implemented and validated.** **Phase 2 Full Platform: GO WITH RISKS.**

No deployment, DNS, Vite preset, or vector-dimension changes were made.

---

## 1. Architecture Changes

**File:** `src/lib/ai-embeddings.server.ts` (only file touched)

Before — single hardcoded provider, no fallback:
```ts
const res = await aiEmbeddings({ model: "openai/text-embedding-3-small", input: inputs });
if (!res.ok) throw new Error(...);
```

After — provider chain with telemetry + circuit-aware error handling:
```ts
const EMBEDDING_CHAIN = [
  "openai/text-embedding-3-small",         // primary, 1536 dims
  "openrouter/openai/text-embedding-3-small", // fallback, 1536 dims
];
// Iterates chain; on 429/5xx/network → next provider.
// On 4xx (non-429) → bail (caller bug, no point falling back).
// Every attempt logs to public.ai_usage (consumer='embeddings', logical_id='embed.small').
// Validates returned vector length === EMBEDDING_DIMS (1536) before returning.
```

**No callers changed.** `embedTexts(_, inputs)` signature preserved → ingest worker (`/api/public/cron/embeddings`), retrieval path (`ai-knowledge.functions.ts`), and copilot/tutor/coach all benefit transparently.

**No schema change.** `public.ai_chunks.embedding` remains `vector(1536)`; HNSW index untouched; no re-embed required.

---

## 2. Fallback Validation

### Live ping — OpenRouter `openai/text-embedding-3-small`

```
HTTP:200  TIME:0.625s  dims=1536
```

✅ Endpoint reachable, dimension-compatible.

### Logical chain matrix (updated)

| Chain | Primary | Fallback | Dims | Health |
| --- | --- | --- | --- | --- |
| `embed.small` | openai/text-embedding-3-small (429) | **openrouter/openai/text-embedding-3-small (200)** | 1536 / 1536 ✅ | 🟢 GREEN |
| `embed.large` | openai/text-embedding-3-large | google/gemini-embedding-001 | 3072 / 3072 | 🟡 documented-only (not wired) |

`embed.small` moved from 🔴 RED → 🟢 GREEN.

### Failure simulation (code-path trace, OpenAI 429 still live)

| Scenario | Ingest | Query | Outcome |
| --- | --- | --- | --- |
| OpenAI 429, OpenRouter ✅ | Primary fails → fallback hits OpenRouter → 1536-dim vector returned → row stored | Same fallback path | ✅ RAG remains functional end-to-end |
| OpenAI ✅, OpenRouter ✅ | Primary succeeds on attempt 1 | Primary succeeds | ✅ Telemetry `outcome=success` |
| OpenAI 429, OpenRouter 429 | Both attempts logged as failure | Both fail | 🔴 Throws — cron worker increments `attempts` |
| OpenAI 400 (bad input) | Bails on first attempt, no fallback | Same | ✅ Correct — fallback would also 400 |

---

## 3. Dimension Verification

| Check | Result |
| --- | --- |
| `EMBEDDING_DIMS` constant | 1536 (unchanged) |
| `public.ai_chunks.embedding` column type | `vector(1536)` (verified via `pg_attribute` in Phase 1.11) |
| OpenAI live response dims | 1536 |
| OpenRouter live response dims | **1536** ✅ |
| Runtime guard | `if (vectors[0].length !== EMBEDDING_DIMS) throw` — refuses to insert wrong-dim vectors |

No corpus migration required. No pgvector index rebuild required.

---

## 4. Cron Risk Assessment

**Current behavior** (`src/routes/api/public/cron/embeddings.ts`):
- `MAX_ATTEMPTS = 4` → after 4 failures, row marked `status='dead'`
- `BATCH = 5` per minute → drains at 7,200 rows/day

**With Path 2 in place:**
- A single OpenAI 429 no longer counts as an attempt failure — the embed call internally falls back to OpenRouter before returning.
- Dead-lettering now only triggers when **both** providers fail concurrently (or worse).

**Recommendations (advisory — not implemented this phase to limit blast radius):**

| Recommendation | Risk if skipped | Suggested phase |
| --- | --- | --- |
| Raise `MAX_ATTEMPTS` from 4 → 10 with exponential `scheduled_for` backoff | Multi-hour dual-provider outage still dead-letters | Phase 1.13 (low-risk one-liner) |
| Add an admin "Requeue dead rows" action to `/dashboard/admin/rag` | Manual SQL needed to recover dead rows | Phase 1.13 |
| Alert when `ai_embeddings_queue` dead count > 0 within rolling 1h | Silent data loss in staging | Phase 1.13 |
| Add OpenAI key presence guard removal (`if (!OPENAI_API_KEY) return 500`) — cron can now run with OpenRouter alone | Cron hard-fails when only OpenRouter is configured | Phase 1.13 |

---

## 5. Telemetry

Every embedding attempt now writes to `public.ai_usage`:
- `consumer = "embeddings"`, `logical_id = "embed.small"`
- `provider`, `model`, `attempt` (1 = primary, 2 = fallback), `outcome` (`success` / `fallback` / `failure`), `latency_ms`, `tokens_in` (approx, char/4), `error_code`

`/dashboard/admin/provider-health` (Phase 1.10) automatically surfaces these new rows in its per-provider aggregation. No dashboard changes required.

---

## 6. Readiness Decision

### 🟢 **GO WITH RISKS — Full Phase 2 staging**

| Surface | Status |
| --- | --- |
| Chat (Assistant, Tutor, Career, Global, Copilot) | ✅ GREEN (3-provider fallback proven Phase 1.10) |
| RAG ingest (cron) | ✅ GREEN (OpenAI → OpenRouter fallback wired) |
| RAG query (retrieval + citations) | ✅ GREEN (same `embedTexts` path) |
| Embedding telemetry | ✅ live in `ai_usage` |
| Admin monitoring | ✅ existing dashboard auto-covers |
| Vector schema | ✅ unchanged (no migration needed) |

### Remaining Risks (accept-and-monitor)

1. **OpenAI billing still unresolved.** Primary attempt logs `failure` + `429` on every call → noisy telemetry until restored. Mitigation: monitor success rate per provider on `/dashboard/admin/provider-health`; if OpenRouter success rate dips below 95% over 1h, halt staging traffic.
2. **Cron `MAX_ATTEMPTS=4`** unchanged — Phase 1.13 hardening recommended before high-volume staging ingest.
3. **`embed.large` still single-provider** — only matters if a future feature switches to 3072-dim embeddings; not blocking.
4. **Health-check endpoint not rate-limited** — Phase 1.10 carryover; admin-only mitigates.

### Recommended Staging Sequence

1. **Stage 2.0 (now-eligible):** Deploy full platform (chat + RAG) to `staging.higaet.com`.
2. **First 48h:** Watch `/dashboard/admin/provider-health` for `embed.small` fallback rate. Expected: ~100% fallback (since OpenAI is 429) with success rate ≥ 99% via OpenRouter.
3. **Phase 1.13 hardening:** Implement cron recommendations from §4 before opening staging to bulk content ingest (>1k docs).
4. **Production cutover candidate** after 7 clean days of staging telemetry AND OpenAI billing restored (gives true 2-deep fallback in prod).

---

**Stop here.** Phase 1.12 implementation + report complete. Awaiting authorization for Phase 2 — Staging Deployment Preparation.
