# HIGAET Phase 1.11 — RAG & Embedding Readiness Validation

**Status:** 🚫 **NO-GO for RAG in Phase 2.** Chat features remain **GO WITH RISKS**.

No deployment, DNS, Vite preset, or runtime changes were made.

---

## 1. Embedding Validation

| Logical chain | Provider/model in code | Dimensions | Vector column | Status |
| --- | --- | --- | --- | --- |
| `embed.small` | `openai/text-embedding-3-small` (hardcoded in `src/lib/ai-embeddings.server.ts`) | 1536 | `public.ai_chunks.embedding vector(1536)` ✅ matches | 🔴 BLOCKED — OpenAI 429 |
| `embed.large` | Not wired in runtime; only present in registry/report doc | 3072 | No matching column | 🟡 Documented-only |

### Findings

- **Single hardcoded model.** `EMBEDDING_MODEL = "openai/text-embedding-3-small"` and `EMBEDDING_DIMS = 1536` are constants in `ai-embeddings.server.ts`. `embedTexts()` calls `aiEmbeddings()` which routes through `splitModelId()` → direct OpenAI fetch. **No fallback path exists at the embedding layer**, unlike chat.
- **Dimension lock-in.** `ai_chunks.embedding` is `vector(1536)`. Switching to `google/gemini-embedding-001` (3072) or `openai/text-embedding-3-large` (3072) requires a schema migration + full re-embed of the corpus.
- **`openrouter/openai/text-embedding-3-small`** is dimension-compatible (1536) and the cheapest unblock — but is not currently wired into `splitModelId()` routing.

---

## 2. RAG Pipeline Validation

| Stage | File | Provider dependency | OpenAI-required? |
| --- | --- | --- | --- |
| Ingestion (enqueue) | `ai_embeddings_queue` insert via `ai_documents` trigger | none | No |
| Chunking | `chunkText()` in `ai-embeddings.server.ts` | none | No |
| Embedding generation | `embedTexts()` → `aiEmbeddings()` | OpenAI direct | **Yes** |
| Vector storage | `ai_chunks` table, `pgvector` HNSW | none | No |
| Retrieval (query) | `match_ai_chunks` RPC + query embedding | OpenAI direct (same `embedTexts`) | **Yes** |
| Citation generation | LLM step (`google/gemini-3-flash-preview` etc.) | chat chain | No |

**Conclusion:** Both write-path (ingest) AND read-path (query embedding) hit OpenAI. With OpenAI 429, RAG is fully offline — no graceful degradation.

---

## 3. Cron Validation

| Job | Route | Behavior with OpenAI down |
| --- | --- | --- |
| `embed-documents` (pg_cron, 1/min) | `POST /api/public/cron/embeddings` | **Hard-fails fast.** Handler returns `500 "Missing OPENAI_API_KEY"` when key absent; on 429 each leased row increments `attempts`, hits `MAX_ATTEMPTS=4`, then marks `dead`. Queue drains into `dead` state. |
| Knowledge refresh | none scheduled (manual via admin RAG page) | n/a |
| Indexing | pgvector HNSW maintained automatically on insert | unaffected |

**Risk:** With sustained OpenAI 429, the queue silently moves rows to `dead` after 4 attempts. New `ai_documents` inserted in staging would accumulate as dead-letter, requiring manual re-queue once OpenAI returns.

---

## 4. Failure Simulation (logical, code-path traced)

| Scenario | Chat | Embed (ingest) | Embed (query) | RAG end-to-end |
| --- | --- | --- | --- | --- |
| OpenAI unavailable | ✅ falls back via registry (Groq/Gemini/OR) | 🔴 fails (no fallback) | 🔴 fails | 🔴 broken |
| Gemini unavailable | ✅ falls back | ✅ unaffected (uses OpenAI) | ✅ unaffected | ✅ works |
| Groq unavailable | ✅ falls back | ✅ unaffected | ✅ unaffected | ✅ works |
| OpenRouter unavailable | ✅ falls back | ✅ unaffected | ✅ unaffected | ✅ works |
| OpenAI + Gemini unavailable | ⚠️ Groq+OR only | 🔴 fails | 🔴 fails | 🔴 broken |

---

## 5. Phase 2 Readiness

### Decision: 🚫 **NO-GO for RAG**, 🟡 **GO WITH RISKS for non-RAG chat**

### Remaining Blockers

| ID | Blocker | Severity |
| --- | --- | --- |
| B2a | Embedding layer has no provider fallback; single hardcoded OpenAI model | **Critical** for RAG |
| B2b | OpenAI billing/quota unresolved (B1a from Phase 1.7) | **Critical** for embeddings |
| B2c | Cron embedding worker dead-letters rows after 4 attempts under 429 | High (data-loss risk in staging) |
| B2d | `embed.large` chain documented but not wired | Low |

### Mitigation Plan

Pick one of three paths before Phase 2 staging includes RAG:

1. **Restore OpenAI billing** (fastest; preserves 1536-dim corpus). Re-run cron drain; verify queue empties to `completed`.
2. **Add OpenRouter embedding routing** (low-risk unblock; dim-compatible). Wire `openrouter/openai/text-embedding-3-small` into `splitModelId()` and a fallback wrapper in `embedTexts()`. No schema change, no re-embed required.
3. **Migrate to `google/gemini-embedding-001`** (highest resilience but expensive). Requires: ALTER `ai_chunks.embedding` → `vector(3072)`, drop+recreate HNSW index, re-embed entire corpus, update `EMBEDDING_DIMS`. Estimate cost before authorizing.

### Recommended Staging Sequence

1. **Stage 2.0 (now-eligible):** deploy chat-only surfaces (Assistant, Tutor, Career, Global, Copilot) with `kb.enabled=false` feature flag — chat fallbacks proven GREEN.
2. **Stage 2.1 (gated on mitigation 1 or 2 above):** enable RAG/KB ingestion and query in staging. Add embed-layer alert: queue depth > 50 or dead-row count > 0.
3. **Stage 2.2 (gated on 48h clean staging telemetry):** production cutover candidate.

### Dashboard / Security Notes

- `/dashboard/admin/provider-health` route guards via `_authenticated` layout + `has_role('admin')` server-side check in both server fns. ✅
- Telemetry aggregation runs through `requireSupabaseAuth` (RLS as admin user), not `supabaseAdmin`. No service-role leak. ✅
- **Open item:** health-check endpoint has no rate limit. Backend currently has no standard rate-limit primitive; admin-only gating is the mitigation. Track as a separate hardening task — do not block Phase 2 on it.

---

**Stop here.** Awaiting authorization for mitigation path (1, 2, or 3) before Phase 2 staging is extended to RAG.
