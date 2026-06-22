-- Ensure pgvector exists (idempotent)
CREATE EXTENSION IF NOT EXISTS vector;

-- One document per (entity_type, entity_id)
ALTER TABLE public.ai_documents
  ADD CONSTRAINT ai_documents_entity_unique UNIQUE (entity_type, entity_id);

-- HNSW index for cosine search over ai_chunks.embedding (1536 dims)
CREATE INDEX IF NOT EXISTS ai_chunks_embedding_hnsw_idx
  ON public.ai_chunks USING hnsw (embedding vector_cosine_ops);

-- Helpful filter index for scoped lookups
CREATE INDEX IF NOT EXISTS ai_documents_entity_idx
  ON public.ai_documents (entity_type, entity_id);

-- Seed retrieval collections
INSERT INTO public.ai_collections (slug, name, description, is_active)
VALUES
  ('lessons', 'Lessons', 'Academy curriculum (structured knowledge)', true),
  ('community_threads', 'Community Threads', 'Emergent peer knowledge', true)
ON CONFLICT (slug) DO NOTHING;

-- =========================================================================
-- Upsert helpers (SECURITY DEFINER so triggers can write regardless of RLS)
-- =========================================================================
CREATE OR REPLACE FUNCTION public.ai_upsert_document_and_enqueue(
  p_entity_type text,
  p_entity_id uuid,
  p_title text,
  p_content text,
  p_collection_slug text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_doc_id uuid;
  v_collection_id uuid;
BEGIN
  IF p_content IS NULL OR length(trim(p_content)) = 0 THEN
    RETURN;
  END IF;

  SELECT id INTO v_collection_id FROM public.ai_collections WHERE slug = p_collection_slug LIMIT 1;

  INSERT INTO public.ai_documents (entity_type, entity_id, title, content, collection_id, embedding_status, chunk_status)
  VALUES (p_entity_type, p_entity_id, p_title, p_content, v_collection_id, 'pending', 'pending')
  ON CONFLICT (entity_type, entity_id) DO UPDATE
    SET title = EXCLUDED.title,
        content = EXCLUDED.content,
        collection_id = EXCLUDED.collection_id,
        embedding_status = 'pending',
        chunk_status = 'pending',
        updated_at = now()
  RETURNING id INTO v_doc_id;

  INSERT INTO public.ai_embeddings_queue (document_id, status, attempts, scheduled_for)
  VALUES (v_doc_id, 'pending', 0, now());
END;
$$;

CREATE OR REPLACE FUNCTION public.ai_delete_document(
  p_entity_type text,
  p_entity_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.ai_documents
   WHERE entity_type = p_entity_type AND entity_id = p_entity_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.ai_upsert_document_and_enqueue(text, uuid, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ai_delete_document(text, uuid) FROM PUBLIC, anon, authenticated;

-- =========================================================================
-- Triggers: lessons
-- =========================================================================
CREATE OR REPLACE FUNCTION public.tg_lessons_enqueue_embedding()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.ai_delete_document('lesson', OLD.id);
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.title IS NOT DISTINCT FROM OLD.title
     AND NEW.content_md IS NOT DISTINCT FROM OLD.content_md THEN
    RETURN NEW;
  END IF;

  PERFORM public.ai_upsert_document_and_enqueue(
    'lesson', NEW.id, NEW.title, NEW.content_md, 'lessons'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS lessons_enqueue_embedding ON public.lessons;
CREATE TRIGGER lessons_enqueue_embedding
  AFTER INSERT OR UPDATE OR DELETE ON public.lessons
  FOR EACH ROW EXECUTE FUNCTION public.tg_lessons_enqueue_embedding();

-- =========================================================================
-- Triggers: threads
-- =========================================================================
CREATE OR REPLACE FUNCTION public.tg_threads_enqueue_embedding()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_text text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.ai_delete_document('thread', OLD.id);
    RETURN OLD;
  END IF;

  -- Skip hidden / soft-deleted threads (remove existing doc)
  IF NEW.is_hidden = true OR NEW.deleted_at IS NOT NULL THEN
    PERFORM public.ai_delete_document('thread', NEW.id);
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE'
     AND NEW.title IS NOT DISTINCT FROM OLD.title
     AND NEW.body  IS NOT DISTINCT FROM OLD.body
     AND NEW.is_hidden IS NOT DISTINCT FROM OLD.is_hidden
     AND NEW.deleted_at IS NOT DISTINCT FROM OLD.deleted_at THEN
    RETURN NEW;
  END IF;

  v_text := coalesce(NEW.title, '') || E'\n\n' || coalesce(NEW.body, '');
  PERFORM public.ai_upsert_document_and_enqueue(
    'thread', NEW.id, NEW.title, v_text, 'community_threads'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS threads_enqueue_embedding ON public.threads;
CREATE TRIGGER threads_enqueue_embedding
  AFTER INSERT OR UPDATE OR DELETE ON public.threads
  FOR EACH ROW EXECUTE FUNCTION public.tg_threads_enqueue_embedding();

-- =========================================================================
-- Scoped retrieval: match_ai_chunks(query, entity_type, entity_ids[], k)
-- =========================================================================
CREATE OR REPLACE FUNCTION public.match_ai_chunks(
  query_embedding vector(1536),
  p_entity_type text,
  p_entity_ids uuid[],
  match_count int DEFAULT 5
)
RETURNS TABLE (
  chunk_id uuid,
  document_id uuid,
  entity_type text,
  entity_id uuid,
  title text,
  chunk_text text,
  similarity float
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id AS chunk_id,
    d.id AS document_id,
    d.entity_type,
    d.entity_id,
    d.title,
    c.chunk_text,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM public.ai_chunks c
  JOIN public.ai_documents d ON d.id = c.document_id
  WHERE d.entity_type = p_entity_type
    AND d.entity_id = ANY (p_entity_ids)
    AND c.embedding IS NOT NULL
  ORDER BY c.embedding <=> query_embedding
  LIMIT GREATEST(1, LEAST(match_count, 50));
$$;

REVOKE EXECUTE ON FUNCTION public.match_ai_chunks(vector, text, uuid[], int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.match_ai_chunks(vector, text, uuid[], int) TO authenticated, service_role;

-- =========================================================================
-- Backfill existing content into the queue
-- =========================================================================
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id, title, content_md FROM public.lessons WHERE content_md IS NOT NULL AND length(trim(content_md)) > 0 LOOP
    PERFORM public.ai_upsert_document_and_enqueue('lesson', r.id, r.title, r.content_md, 'lessons');
  END LOOP;

  FOR r IN SELECT id, title, body FROM public.threads
           WHERE (is_hidden IS DISTINCT FROM true) AND deleted_at IS NULL
             AND coalesce(body, '') <> '' LOOP
    PERFORM public.ai_upsert_document_and_enqueue('thread', r.id, r.title, coalesce(r.title,'') || E'\n\n' || coalesce(r.body,''), 'community_threads');
  END LOOP;
END $$;