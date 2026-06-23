-- 1. Anon SELECT on profiles for explicitly public portfolios only.
CREATE POLICY "profiles public portfolio read"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (portfolio_visibility = 'public');

GRANT SELECT ON public.profiles TO anon;

-- 2. Anon SELECT on certificates linked to a public portfolio that opted-in.
CREATE POLICY "certificates public portfolio read"
ON public.certificates
FOR SELECT
TO anon, authenticated
USING (
  revoked = false
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = certificates.student_id
      AND p.portfolio_visibility = 'public'
      AND p.show_certificates = true
  )
);

GRANT SELECT ON public.certificates TO anon;

-- 3. Anon SELECT on graded project submissions linked to a public portfolio that opted-in.
CREATE POLICY "project_submissions public portfolio read"
ON public.project_submissions
FOR SELECT
TO anon, authenticated
USING (
  status IN ('passed', 'reviewed')
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = project_submissions.student_id
      AND p.portfolio_visibility = 'public'
      AND p.show_projects = true
  )
);

GRANT SELECT ON public.project_submissions TO anon;

-- 4. ai_usage: admin-only read/write. Closes the "RLS on, zero policies" gap.
CREATE POLICY "ai_usage admin all"
ON public.ai_usage
FOR ALL
TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::public.app_role[]))
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::public.app_role[]));
