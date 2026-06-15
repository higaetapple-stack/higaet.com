
-- 1. Fix tech_projects "Members view their projects" self-join bug
DROP POLICY IF EXISTS "Members view their projects" ON public.tech_projects;
CREATE POLICY "Members view their projects" ON public.tech_projects
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.tech_project_members m
    WHERE m.project_id = tech_projects.id AND m.user_id = auth.uid()
  )
  OR project_manager = auth.uid()
);

-- 2. Drop overly broad public portfolio profile read policy.
--    Public portfolios are served via getPublicPortfolio server fn (admin client),
--    which respects show_email/show_phone flags.
DROP POLICY IF EXISTS "profiles public portfolio read" ON public.profiles;

-- 3. Prevent students from modifying grading columns on their own submissions
CREATE OR REPLACE FUNCTION public.prevent_student_grade_tampering()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'super_admin'::app_role,'faculty'::app_role]) THEN
    RETURN NEW;
  END IF;
  -- Caller is not staff: preserve grading columns from OLD
  NEW.status     := OLD.status;
  NEW.score      := OLD.score;
  NEW.feedback   := OLD.feedback;
  NEW.graded_by  := OLD.graded_by;
  NEW.graded_at  := OLD.graded_at;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS submissions_prevent_student_grade ON public.submissions;
CREATE TRIGGER submissions_prevent_student_grade
  BEFORE UPDATE ON public.submissions
  FOR EACH ROW EXECUTE FUNCTION public.prevent_student_grade_tampering();

DROP TRIGGER IF EXISTS psub_prevent_student_grade ON public.project_submissions;
CREATE TRIGGER psub_prevent_student_grade
  BEFORE UPDATE ON public.project_submissions
  FOR EACH ROW EXECUTE FUNCTION public.prevent_student_grade_tampering();
