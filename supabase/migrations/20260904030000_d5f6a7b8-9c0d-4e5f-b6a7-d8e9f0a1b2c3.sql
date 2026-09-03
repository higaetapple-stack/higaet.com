-- CRM parity for the generic public leads table (main + academy divisions).
-- Mirrors study_abroad_leads / technologies_leads CRM columns and tightens
-- the anonymous INSERT policy so callers cannot preset CRM state.

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS crm_status public.crm_status NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS crm_substatus text,
  ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS leads_assigned_idx
  ON public.leads (assigned_to, crm_status);

DROP POLICY IF EXISTS leads_public_insert ON public.leads;
CREATE POLICY leads_public_insert ON public.leads
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(btrim(full_name)) > 0
    AND length(btrim(email)) > 0
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND division IN ('main', 'academy')
    AND status = 'new'
    AND crm_status = 'new'
    AND crm_substatus IS NULL
    AND assigned_to IS NULL
  );
