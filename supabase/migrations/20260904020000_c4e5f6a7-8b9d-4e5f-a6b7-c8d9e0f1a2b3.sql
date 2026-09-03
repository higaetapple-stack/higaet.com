-- Generic public lead capture for the `main` and `academy` divisions.
-- Division-specific tables (study_abroad_leads, technologies_leads) are unchanged.
-- Mirrors existing lead-table conventions: uuid PK, status default 'new',
-- anon INSERT-only via a constrained WITH CHECK policy, admin full access,
-- updated_at trigger, operational indexes.

CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  division text NOT NULL CHECK (division IN ('main', 'academy')),
  source text,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  message text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.leads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS leads_public_insert ON public.leads;
CREATE POLICY leads_public_insert ON public.leads
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(btrim(full_name)) > 0
    AND length(btrim(email)) > 0
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND division IN ('main', 'academy')
    AND status = 'new'
  );

DROP POLICY IF EXISTS leads_admin_all ON public.leads;
CREATE POLICY leads_admin_all ON public.leads FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS leads_division_created_idx
  ON public.leads (division, created_at DESC);
CREATE INDEX IF NOT EXISTS leads_status_idx
  ON public.leads (status);

DROP TRIGGER IF EXISTS trg_leads_updated ON public.leads;
CREATE TRIGGER trg_leads_updated BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
