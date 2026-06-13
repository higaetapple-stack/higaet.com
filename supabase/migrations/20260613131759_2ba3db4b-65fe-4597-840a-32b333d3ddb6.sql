
CREATE EXTENSION IF NOT EXISTS vector;

-- =========================================================
-- ai_collections
-- =========================================================
CREATE TABLE public.ai_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_collections TO authenticated;
GRANT ALL ON public.ai_collections TO service_role;
ALTER TABLE public.ai_collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage ai_collections"
  ON public.ai_collections FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_ai_collections_updated
  BEFORE UPDATE ON public.ai_collections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Extend knowledge_sources & ai_documents with collection link
ALTER TABLE public.knowledge_sources
  ADD COLUMN IF NOT EXISTS collection_id uuid REFERENCES public.ai_collections(id) ON DELETE SET NULL;
ALTER TABLE public.ai_documents
  ADD COLUMN IF NOT EXISTS collection_id uuid REFERENCES public.ai_collections(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS chunk_status text NOT NULL DEFAULT 'pending';

-- =========================================================
-- ai_chunks
-- =========================================================
CREATE TABLE public.ai_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES public.ai_documents(id) ON DELETE CASCADE,
  collection_id uuid REFERENCES public.ai_collections(id) ON DELETE SET NULL,
  source_id uuid REFERENCES public.knowledge_sources(id) ON DELETE SET NULL,
  chunk_order int NOT NULL DEFAULT 0,
  chunk_text text NOT NULL,
  token_count int,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  embedding vector(1536),
  embedding_status text NOT NULL DEFAULT 'pending',
  embedded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_chunks TO authenticated;
GRANT ALL ON public.ai_chunks TO service_role;
ALTER TABLE public.ai_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage ai_chunks"
  ON public.ai_chunks FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_ai_chunks_updated
  BEFORE UPDATE ON public.ai_chunks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX ai_chunks_collection_idx ON public.ai_chunks(collection_id);
CREATE INDEX ai_chunks_document_idx ON public.ai_chunks(document_id);
CREATE INDEX ai_chunks_status_idx ON public.ai_chunks(embedding_status);
CREATE INDEX ai_chunks_embedding_idx
  ON public.ai_chunks USING hnsw (embedding vector_cosine_ops);

-- =========================================================
-- ai_agent_configs
-- =========================================================
CREATE TABLE public.ai_agent_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  system_prompt text NOT NULL,
  model text NOT NULL DEFAULT 'google/gemini-3-flash-preview',
  temperature numeric NOT NULL DEFAULT 0.3,
  collection_ids uuid[] NOT NULL DEFAULT ARRAY[]::uuid[],
  max_chunks int NOT NULL DEFAULT 8,
  enabled boolean NOT NULL DEFAULT true,
  visibility text NOT NULL DEFAULT 'admin', -- admin | authenticated | public
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_agent_configs TO authenticated;
GRANT ALL ON public.ai_agent_configs TO service_role;
ALTER TABLE public.ai_agent_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage ai_agent_configs"
  ON public.ai_agent_configs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_ai_agent_configs_updated
  BEFORE UPDATE ON public.ai_agent_configs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- ai_conversation_logs
-- =========================================================
CREATE TABLE public.ai_conversation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES public.ai_agent_configs(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  prompt text NOT NULL,
  response text,
  retrieved_chunk_ids uuid[] NOT NULL DEFAULT ARRAY[]::uuid[],
  model text,
  prompt_tokens int,
  completion_tokens int,
  latency_ms int,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_conversation_logs TO authenticated;
GRANT ALL ON public.ai_conversation_logs TO service_role;
ALTER TABLE public.ai_conversation_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view all conversation logs"
  ON public.ai_conversation_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users view own conversation logs"
  ON public.ai_conversation_logs FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Users insert own conversation logs"
  ON public.ai_conversation_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE INDEX ai_conversation_logs_user_idx ON public.ai_conversation_logs(user_id);
CREATE INDEX ai_conversation_logs_agent_idx ON public.ai_conversation_logs(agent_id);

-- =========================================================
-- ai_feedback
-- =========================================================
CREATE TABLE public.ai_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_log_id uuid NOT NULL REFERENCES public.ai_conversation_logs(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  rating smallint NOT NULL, -- -1, 0, 1
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_feedback TO authenticated;
GRANT ALL ON public.ai_feedback TO service_role;
ALTER TABLE public.ai_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view all feedback"
  ON public.ai_feedback FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users manage own feedback"
  ON public.ai_feedback FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =========================================================
-- Retrieval RPC
-- =========================================================
CREATE OR REPLACE FUNCTION public.match_ai_chunks(
  query_embedding vector(1536),
  match_count int DEFAULT 8,
  collection_ids uuid[] DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  collection_id uuid,
  chunk_text text,
  metadata jsonb,
  similarity float
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id,
    c.document_id,
    c.collection_id,
    c.chunk_text,
    c.metadata,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM public.ai_chunks c
  WHERE c.embedding IS NOT NULL
    AND (collection_ids IS NULL OR c.collection_id = ANY(collection_ids))
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- =========================================================
-- Seed default collections
-- =========================================================
INSERT INTO public.ai_collections (slug, name, description) VALUES
  ('academy', 'Academy', 'Programs, courses, lessons, assignments, projects'),
  ('global-education', 'Global Education', 'Countries, universities, scholarships, visa knowledge'),
  ('career', 'Career', 'Placements, jobs, resumes, interview prep'),
  ('technologies', 'Technologies', 'Services, projects, support articles'),
  ('crm', 'CRM', 'Internal CRM notes, follow-ups, playbooks'),
  ('policies', 'Policies', 'Institutional policies and SOPs'),
  ('marketing', 'Marketing', 'Marketing copy, FAQs, success stories')
ON CONFLICT (slug) DO NOTHING;
