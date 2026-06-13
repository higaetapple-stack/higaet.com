
CREATE TABLE IF NOT EXISTS public.counselor_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  counselor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  unassigned_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.counselor_assignments TO authenticated;
GRANT ALL ON public.counselor_assignments TO service_role;
ALTER TABLE public.counselor_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "counselor_assignments staff manage" ON public.counselor_assignments FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','counselor','placement_officer']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','counselor','placement_officer']::app_role[]));
CREATE INDEX IF NOT EXISTS counselor_assignments_entity_idx ON public.counselor_assignments(entity_type, entity_id, active);
CREATE INDEX IF NOT EXISTS counselor_assignments_counselor_idx ON public.counselor_assignments(counselor_id, active);
CREATE UNIQUE INDEX IF NOT EXISTS counselor_assignments_active_uniq
  ON public.counselor_assignments(entity_type, entity_id, counselor_id) WHERE active;
CREATE TRIGGER set_counselor_assignments_updated_at BEFORE UPDATE ON public.counselor_assignments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
