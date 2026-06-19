-- 1) Replace broad staff read on profiles with role-scoped policies
DROP POLICY IF EXISTS "profiles staff read" ON public.profiles;

-- Counselors, placement officers, admins, super_admins still need full directory access for CRM/placements
CREATE POLICY "profiles ops staff read"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.has_any_role(auth.uid(), ARRAY['counselor'::app_role,'placement_officer'::app_role,'admin'::app_role,'super_admin'::app_role])
);

-- Faculty/mentors can only read profiles of students enrolled in their courses
CREATE POLICY "profiles faculty mentor scoped read"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.has_any_role(auth.uid(), ARRAY['faculty'::app_role,'mentor'::app_role])
  AND EXISTS (
    SELECT 1
    FROM public.enrollments e
    JOIN public.courses c ON c.program_id = e.program_id
    JOIN public.course_faculty cf ON cf.course_id = c.id
    WHERE e.student_id = profiles.id
      AND cf.faculty_id = auth.uid()
  )
);

-- 2) Defense-in-depth WITH CHECK on tech_proposals client update
DROP POLICY IF EXISTS "Tech clients update response" ON public.tech_proposals;
CREATE POLICY "Tech clients update response"
ON public.tech_proposals
FOR UPDATE
TO authenticated
USING (
  status = ANY (ARRAY['sent'::tech_proposal_status,'viewed'::tech_proposal_status,'negotiation'::tech_proposal_status])
  AND EXISTS (
    SELECT 1 FROM public.tech_clients c
    WHERE c.id = tech_proposals.client_id AND c.portal_user = auth.uid()
  )
)
WITH CHECK (
  status = ANY (ARRAY['sent'::tech_proposal_status,'viewed'::tech_proposal_status,'negotiation'::tech_proposal_status,'accepted'::tech_proposal_status,'rejected'::tech_proposal_status])
  AND EXISTS (
    SELECT 1 FROM public.tech_clients c
    WHERE c.id = tech_proposals.client_id AND c.portal_user = auth.uid()
  )
);