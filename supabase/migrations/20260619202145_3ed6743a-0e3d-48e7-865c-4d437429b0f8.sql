-- 1) Restrict self-enrollment to published programs
DROP POLICY IF EXISTS "enrollments self insert" ON public.enrollments;
CREATE POLICY "enrollments self insert"
ON public.enrollments
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = student_id
  AND EXISTS (
    SELECT 1 FROM public.programs p
    WHERE p.id = enrollments.program_id
      AND p.status = 'published'
  )
);

-- 2) Prevent tech clients from modifying protected proposal fields
CREATE OR REPLACE FUNCTION public.tech_proposals_guard_client_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Staff/admin bypass
  IF public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'super_admin'::app_role]) THEN
    RETURN NEW;
  END IF;

  -- For non-staff (i.e. client portal users), preserve protected fields from OLD
  NEW.title           := OLD.title;
  NEW.summary         := OLD.summary;
  NEW.total_amount    := OLD.total_amount;
  NEW.currency        := OLD.currency;
  NEW.valid_until     := OLD.valid_until;
  NEW.current_version := OLD.current_version;
  NEW.client_id       := OLD.client_id;
  NEW.project_id      := OLD.project_id;
  NEW.created_by      := OLD.created_by;
  NEW.created_at      := OLD.created_at;
  NEW.sent_at         := OLD.sent_at;
  -- status: allow only transition to 'accepted' or 'rejected' from sent/viewed/negotiation
  IF NEW.status IS DISTINCT FROM OLD.status
     AND NEW.status NOT IN ('accepted'::tech_proposal_status, 'rejected'::tech_proposal_status) THEN
    NEW.status := OLD.status;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tech_proposals_guard_client_update ON public.tech_proposals;
CREATE TRIGGER tech_proposals_guard_client_update
BEFORE UPDATE ON public.tech_proposals
FOR EACH ROW
EXECUTE FUNCTION public.tech_proposals_guard_client_update();