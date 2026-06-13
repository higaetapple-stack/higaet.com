
-- ─── Add new role ───────────────────────────────────────────────────────────
DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'tech_client';
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.tech_client_status AS ENUM ('lead','discovery','proposal','approved','active','completed','archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.tech_project_status AS ENUM ('planning','active','on_hold','completed','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.tech_milestone_status AS ENUM ('not_started','in_progress','blocked','done','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Tables (no policies yet) ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tech_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company text NOT NULL,
  slug text UNIQUE,
  contact_person text,
  email text,
  phone text,
  industry text,
  website text,
  status public.tech_client_status NOT NULL DEFAULT 'lead',
  owner uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  portal_user uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tech_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.tech_clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text,
  description text,
  status public.tech_project_status NOT NULL DEFAULT 'planning',
  start_date date,
  end_date date,
  budget numeric(12,2),
  currency text DEFAULT 'USD',
  project_manager uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tech_project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.tech_projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'Developer',
  allocation_pct int DEFAULT 100,
  added_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.tech_project_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.tech_projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status public.tech_milestone_status NOT NULL DEFAULT 'not_started',
  due_date date,
  completion_pct int NOT NULL DEFAULT 0,
  order_index int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tech_project_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.tech_projects(id) ON DELETE CASCADE,
  category text,
  file_url text NOT NULL,
  file_name text,
  file_size bigint,
  visible_to_client boolean NOT NULL DEFAULT false,
  uploaded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Indexes ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_tech_clients_status ON public.tech_clients(status);
CREATE INDEX IF NOT EXISTS idx_tech_clients_portal_user ON public.tech_clients(portal_user);
CREATE INDEX IF NOT EXISTS idx_tech_projects_client ON public.tech_projects(client_id);
CREATE INDEX IF NOT EXISTS idx_tech_projects_status ON public.tech_projects(status);
CREATE INDEX IF NOT EXISTS idx_tech_projects_pm ON public.tech_projects(project_manager);
CREATE INDEX IF NOT EXISTS idx_tpm_project ON public.tech_project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_tpm_user ON public.tech_project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_tpms_project ON public.tech_project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_tpd_project ON public.tech_project_documents(project_id);

-- ─── Grants + RLS ───────────────────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tech_clients TO authenticated;
GRANT ALL ON public.tech_clients TO service_role;
ALTER TABLE public.tech_clients ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tech_projects TO authenticated;
GRANT ALL ON public.tech_projects TO service_role;
ALTER TABLE public.tech_projects ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tech_project_members TO authenticated;
GRANT ALL ON public.tech_project_members TO service_role;
ALTER TABLE public.tech_project_members ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tech_project_milestones TO authenticated;
GRANT ALL ON public.tech_project_milestones TO service_role;
ALTER TABLE public.tech_project_milestones ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tech_project_documents TO authenticated;
GRANT ALL ON public.tech_project_documents TO service_role;
ALTER TABLE public.tech_project_documents ENABLE ROW LEVEL SECURITY;

-- ─── Triggers ───────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_tech_clients_updated ON public.tech_clients;
CREATE TRIGGER trg_tech_clients_updated BEFORE UPDATE ON public.tech_clients
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_tech_projects_updated ON public.tech_projects;
CREATE TRIGGER trg_tech_projects_updated BEFORE UPDATE ON public.tech_projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_tech_milestones_updated ON public.tech_project_milestones;
CREATE TRIGGER trg_tech_milestones_updated BEFORE UPDATE ON public.tech_project_milestones
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── Policies ───────────────────────────────────────────────────────────────
CREATE POLICY "Staff manage tech clients" ON public.tech_clients
  FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]));
CREATE POLICY "Client sees own record" ON public.tech_clients
  FOR SELECT TO authenticated USING (portal_user = auth.uid());

CREATE POLICY "Staff manage tech projects" ON public.tech_projects
  FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]));
CREATE POLICY "Members view their projects" ON public.tech_projects
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.tech_project_members m WHERE m.project_id = id AND m.user_id = auth.uid())
    OR project_manager = auth.uid()
  );
CREATE POLICY "Client views own projects" ON public.tech_projects
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.tech_clients c WHERE c.id = client_id AND c.portal_user = auth.uid())
  );

CREATE POLICY "Staff manage project members" ON public.tech_project_members
  FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]));
CREATE POLICY "Members view their team" ON public.tech_project_members
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.tech_project_members m WHERE m.project_id = tech_project_members.project_id AND m.user_id = auth.uid())
  );

CREATE POLICY "Staff manage milestones" ON public.tech_project_milestones
  FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]));
CREATE POLICY "Members view milestones" ON public.tech_project_milestones
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.tech_project_members m WHERE m.project_id = tech_project_milestones.project_id AND m.user_id = auth.uid())
  );
CREATE POLICY "Client views milestones" ON public.tech_project_milestones
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.tech_projects p
      JOIN public.tech_clients c ON c.id = p.client_id
      WHERE p.id = tech_project_milestones.project_id AND c.portal_user = auth.uid()
    )
  );

CREATE POLICY "Staff manage project docs" ON public.tech_project_documents
  FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]));
CREATE POLICY "Members view project docs" ON public.tech_project_documents
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.tech_project_members m WHERE m.project_id = tech_project_documents.project_id AND m.user_id = auth.uid())
  );
CREATE POLICY "Client views shared docs" ON public.tech_project_documents
  FOR SELECT TO authenticated USING (
    visible_to_client = true
    AND EXISTS (
      SELECT 1 FROM public.tech_projects p
      JOIN public.tech_clients c ON c.id = p.client_id
      WHERE p.id = tech_project_documents.project_id AND c.portal_user = auth.uid()
    )
  );
