
DROP POLICY IF EXISTS sa_leads_auth_insert ON public.study_abroad_leads;
DROP POLICY IF EXISTS sa_leads_public_insert ON public.study_abroad_leads;
DROP POLICY IF EXISTS tech_leads_auth_insert ON public.technologies_leads;
DROP POLICY IF EXISTS tech_leads_public_insert ON public.technologies_leads;

CREATE POLICY sa_leads_public_insert ON public.study_abroad_leads
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(btrim(full_name)) > 0
    AND length(btrim(email)) > 0
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND assigned_to IS NULL
    AND assigned_to_counselor IS NULL
    AND status = 'new'
    AND crm_status = 'new'
    AND crm_substatus IS NULL
  );

CREATE POLICY tech_leads_public_insert ON public.technologies_leads
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(btrim(full_name)) > 0
    AND length(btrim(email)) > 0
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND assigned_to IS NULL
    AND status = 'new'
    AND crm_status = 'new'
    AND crm_substatus IS NULL
  );
