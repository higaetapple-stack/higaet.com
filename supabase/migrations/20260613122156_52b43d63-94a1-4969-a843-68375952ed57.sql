
-- Status enum
DO $$ BEGIN
  CREATE TYPE public.visa_status AS ENUM (
    'draft','documents_pending','ready_to_submit','submitted',
    'interview_scheduled','administrative_processing','approved','rejected','closed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── visa_cases ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.visa_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES public.applications(id) ON DELETE SET NULL,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  country_id uuid REFERENCES public.countries(id) ON DELETE SET NULL,
  visa_type text,
  status public.visa_status NOT NULL DEFAULT 'draft',
  assigned_counselor uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  interview_date date,
  interview_time time,
  interview_location text,
  interview_notes text,
  submitted_at timestamptz,
  decision_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_visa_cases_student ON public.visa_cases(student_id);
CREATE INDEX IF NOT EXISTS idx_visa_cases_counselor ON public.visa_cases(assigned_counselor);
CREATE INDEX IF NOT EXISTS idx_visa_cases_status ON public.visa_cases(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.visa_cases TO authenticated;
GRANT ALL ON public.visa_cases TO service_role;
ALTER TABLE public.visa_cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students view own visa cases" ON public.visa_cases
  FOR SELECT TO authenticated USING (student_id = auth.uid());
CREATE POLICY "Staff manage visa cases" ON public.visa_cases
  FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','counselor']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','counselor']::app_role[]));

CREATE TRIGGER trg_visa_cases_updated BEFORE UPDATE ON public.visa_cases
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── visa_documents ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.visa_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visa_case_id uuid NOT NULL REFERENCES public.visa_cases(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  file_url text NOT NULL,
  file_name text,
  file_size bigint,
  verified boolean NOT NULL DEFAULT false,
  verified_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  verified_at timestamptz,
  notes text,
  uploaded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_visa_docs_case ON public.visa_documents(visa_case_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.visa_documents TO authenticated;
GRANT ALL ON public.visa_documents TO service_role;
ALTER TABLE public.visa_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students view own visa docs" ON public.visa_documents
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.visa_cases vc WHERE vc.id = visa_case_id AND vc.student_id = auth.uid())
  );
CREATE POLICY "Students upload to own cases" ON public.visa_documents
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.visa_cases vc WHERE vc.id = visa_case_id AND vc.student_id = auth.uid())
  );
CREATE POLICY "Staff manage visa docs" ON public.visa_documents
  FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','counselor']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','counselor']::app_role[]));

CREATE TRIGGER trg_visa_docs_updated BEFORE UPDATE ON public.visa_documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── visa_status_history ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.visa_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visa_case_id uuid NOT NULL REFERENCES public.visa_cases(id) ON DELETE CASCADE,
  old_status public.visa_status,
  new_status public.visa_status NOT NULL,
  changed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_visa_history_case ON public.visa_status_history(visa_case_id);

GRANT SELECT, INSERT ON public.visa_status_history TO authenticated;
GRANT ALL ON public.visa_status_history TO service_role;
ALTER TABLE public.visa_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students view own visa history" ON public.visa_status_history
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.visa_cases vc WHERE vc.id = visa_case_id AND vc.student_id = auth.uid())
  );
CREATE POLICY "Staff manage visa history" ON public.visa_status_history
  FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','counselor']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','counselor']::app_role[]));
