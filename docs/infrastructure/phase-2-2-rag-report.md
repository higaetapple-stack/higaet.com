# Phase 2.2 — Embedding & RAG Report

**Status:** ⛔ NOT EXECUTED — blocked by `phase-2-2-prerequisite-report.md`.

## Coverage Plan

### Embeddings (Phase 1.12 / 1.13 surface)

| Validation | How |
| --- | --- |
| Primary provider | Queue a fresh `ai_documents` row; observe `ai_chunks` populated with 1536-dim vectors. |
| Fallback provider | Set `OPENAI_API_KEY=invalid` temporarily on staging; requeue; observe OpenRouter path completes. |
| Queue processing | `/dashboard/admin/provider-health → Embedding queue` shows item transitioning `pending → processing → completed`. |
| Retry handling | Force a transient failure; observe attempts increment up to `MAX_ATTEMPTS=10` then `dead`; "Requeue all dead" restores. |

### Retrieval

| Validation | Pass criteria |
| --- | --- |
| Indexing | Newly embedded doc retrievable by exact-keyword query within 60 s. |
| Accuracy | Top-3 results include the seed doc for 5 representative queries. |
| Latency | p95 retrieval ≤ 1.5 s measured on staging. |

### RAG

| Validation | Pass criteria |
| --- | --- |
| Retrieval pipeline | Citations resolve to known chunk IDs. |
| Answer generation | At least one cited source per answer; no hallucinated citations. |
| Fallback handling | With OpenAI disabled, answers still generated via Gemini/OpenRouter; citations unchanged. |

## Recording Contract

Attach for each run:

- 5-query accuracy spreadsheet (query / expected doc / top-3 returned).
- Latency histogram from `ai_usage` filtered to `lane='embedding'` and `lane='retrieval'`.
- Screenshot of embedding-queue dashboard during forced fallback.

## Result

Pending deployment. No RAG validation performed in this phase.
