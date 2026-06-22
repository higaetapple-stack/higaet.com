# RAG Worker Failure

## Symptoms
- `ai_embeddings_queue` rows pending > 1 hour
- AI chat returns "no relevant context" for known indexed content
- `domain_events` shows no recent `rag.embedding_completed`

## Inspect
```sql
SELECT status, count(*) FROM ai_embeddings_queue GROUP BY status;
SELECT * FROM ai_embeddings_queue
WHERE status IN ('pending','failed') ORDER BY scheduled_for LIMIT 20;
```

## Causes
- Lovable AI gateway rate-limited / down → retries auto-backoff. Verify `LOVABLE_API_KEY` valid.
- Embedding dimensions changed → all `ai_chunks.embedding` must be recomputed; truncate and re-enqueue.
- Document content empty after trigger → check `ai_upsert_document_and_enqueue` source rows.

## Recovery
- Re-enqueue specific document:
  ```sql
  INSERT INTO ai_embeddings_queue (document_id, status, attempts, scheduled_for)
  SELECT id, 'pending', 0, now() FROM ai_documents WHERE entity_type='lesson' AND entity_id='<uuid>';
  ```
- Backfill entire collection:
  ```sql
  UPDATE ai_documents SET embedding_status='pending', chunk_status='pending'
  WHERE collection_id = (SELECT id FROM ai_collections WHERE slug='lessons');
  ```

## Boundary regression
If retrieval starts returning chunks outside expected collections, check `rag.collection_rejected` / `rag.scope_violation` events and the `resolveAllowedCollections` map in `src/lib/ai-copilot.functions.ts`.
