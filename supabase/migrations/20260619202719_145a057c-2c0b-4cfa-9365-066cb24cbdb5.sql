DROP POLICY IF EXISTS "profiles ops staff read" ON public.profiles;
DROP POLICY IF EXISTS "profiles counselor scoped read" ON public.profiles;
DROP POLICY IF EXISTS "profiles placement officer scoped read" ON public.profiles;

CREATE POLICY "profiles counselor scoped read"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'counselor'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.counselor_assignments ca
    WHERE ca.counselor_id = auth.uid()
      AND ca.active = true
      AND (
        (ca.entity_type = 'student' AND ca.entity_id = profiles.id)
        OR (ca.entity_type = 'application' AND EXISTS (
              SELECT 1 FROM public.applications a WHERE a.id = ca.entity_id AND a.student_id = profiles.id))
      )
  )
);

CREATE POLICY "profiles placement officer scoped read"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'placement_officer'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.placements p WHERE p.student_id = profiles.id
  )
);