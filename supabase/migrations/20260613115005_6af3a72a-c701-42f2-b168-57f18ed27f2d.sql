
-- Sprint 4.5: Unified CRM + AI prep tables

DO $$ BEGIN
  CREATE TYPE public.crm_status AS ENUM ('new','contacted','qualified','in_progress','converted','closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.study_abroad_leads
  ADD COLUMN IF NOT EXISTS crm_status public.crm_status NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS crm_substatus text,
  ADD COLUMN IF NOT EXISTS assigned_to_counselor uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.technologies_leads
  ADD COLUMN IF NOT EXISTS crm_status public.crm_status NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS crm_substatus text,
  ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS crm_status public.crm_status NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS crm_substatus text,
  ADD COLUMN IF NOT EXISTS assigned_to_counselor uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.job_applications
  ADD COLUMN IF NOT EXISTS crm_status public.crm_status NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS crm_substatus text;

ALTER TABLE public.placements
  ADD COLUMN IF NOT EXISTS crm_status public.crm_status NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS crm_substatus text;

CREATE TABLE IF NOT EXISTS public.crm_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  author_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  note text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_notes TO authenticated;
GRANT ALL ON public.crm_notes TO service_role;
ALTER TABLE public.crm_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm_notes staff manage" ON public.crm_notes FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','counselor','placement_officer']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','counselor','placement_officer']::app_role[]));
CREATE INDEX IF NOT EXISTS crm_notes_entity_idx ON public.crm_notes(entity_type, entity_id);
CREATE TRIGGER set_crm_notes_updated_at BEFORE UPDATE ON public.crm_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.crm_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'open',
  due_date timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_tasks TO authenticated;
GRANT ALL ON public.crm_tasks TO service_role;
ALTER TABLE public.crm_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm_tasks staff manage" ON public.crm_tasks FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','counselor','placement_officer']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','counselor','placement_officer']::app_role[]));
CREATE INDEX IF NOT EXISTS crm_tasks_entity_idx ON public.crm_tasks(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS crm_tasks_assigned_idx ON public.crm_tasks(assigned_to, status);
CREATE TRIGGER set_crm_tasks_updated_at BEFORE UPDATE ON public.crm_tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.crm_follow_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  scheduled_at timestamptz NOT NULL,
  channel text NOT NULL DEFAULT 'email',
  status text NOT NULL DEFAULT 'scheduled',
  notes text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_follow_ups TO authenticated;
GRANT ALL ON public.crm_follow_ups TO service_role;
ALTER TABLE public.crm_follow_ups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm_follow_ups staff manage" ON public.crm_follow_ups FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','counselor','placement_officer']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','counselor','placement_officer']::app_role[]));
CREATE INDEX IF NOT EXISTS crm_follow_ups_entity_idx ON public.crm_follow_ups(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS crm_follow_ups_sched_idx ON public.crm_follow_ups(scheduled_at, status);
CREATE TRIGGER set_crm_follow_ups_updated_at BEFORE UPDATE ON public.crm_follow_ups
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.crm_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  event_type text NOT NULL,
  description text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.crm_activity_log TO authenticated;
GRANT ALL ON public.crm_activity_log TO service_role;
ALTER TABLE public.crm_activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crm_activity_log staff read" ON public.crm_activity_log FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','counselor','placement_officer']::app_role[]));
CREATE POLICY "crm_activity_log staff insert" ON public.crm_activity_log FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','counselor','placement_officer']::app_role[]));
CREATE INDEX IF NOT EXISTS crm_activity_entity_idx ON public.crm_activity_log(entity_type, entity_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.knowledge_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  source_type text NOT NULL,
  description text,
  active boolean NOT NULL DEFAULT true,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.knowledge_sources TO authenticated;
GRANT ALL ON public.knowledge_sources TO service_role;
ALTER TABLE public.knowledge_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "knowledge_sources admin manage" ON public.knowledge_sources FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]));
CREATE TRIGGER set_knowledge_sources_updated_at BEFORE UPDATE ON public.knowledge_sources
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.ai_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid REFERENCES public.knowledge_sources(id) ON DELETE SET NULL,
  entity_type text,
  entity_id uuid,
  title text NOT NULL,
  content text,
  url text,
  language text DEFAULT 'en',
  tags text[] NOT NULL DEFAULT '{}',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  embedding_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_documents TO authenticated;
GRANT ALL ON public.ai_documents TO service_role;
ALTER TABLE public.ai_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_documents admin manage" ON public.ai_documents FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]));
CREATE INDEX IF NOT EXISTS ai_documents_entity_idx ON public.ai_documents(entity_type, entity_id);
CREATE TRIGGER set_ai_documents_updated_at BEFORE UPDATE ON public.ai_documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.ai_embeddings_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES public.ai_documents(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'queued',
  attempts int NOT NULL DEFAULT 0,
  last_error text,
  scheduled_for timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_embeddings_queue TO authenticated;
GRANT ALL ON public.ai_embeddings_queue TO service_role;
ALTER TABLE public.ai_embeddings_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_embeddings_queue admin manage" ON public.ai_embeddings_queue FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]));
CREATE INDEX IF NOT EXISTS ai_embeddings_queue_status_idx ON public.ai_embeddings_queue(status, scheduled_for);
CREATE TRIGGER set_ai_embeddings_queue_updated_at BEFORE UPDATE ON public.ai_embeddings_queue
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
