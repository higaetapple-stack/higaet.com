
DROP TRIGGER IF EXISTS prevent_submission_grade_tampering ON public.submissions;
CREATE TRIGGER prevent_submission_grade_tampering
BEFORE UPDATE ON public.submissions
FOR EACH ROW EXECUTE FUNCTION public.prevent_student_grade_tampering();

DROP TRIGGER IF EXISTS prevent_project_submission_grade_tampering ON public.project_submissions;
CREATE TRIGGER prevent_project_submission_grade_tampering
BEFORE UPDATE ON public.project_submissions
FOR EACH ROW EXECUTE FUNCTION public.prevent_student_grade_tampering();

DROP POLICY IF EXISTS "Members view their projects" ON public.tech_projects;
CREATE POLICY "Members view their projects" ON public.tech_projects
FOR SELECT TO authenticated
USING (
  (EXISTS (SELECT 1 FROM public.tech_project_members m WHERE m.project_id = tech_projects.id AND m.user_id = auth.uid()))
  OR project_manager = auth.uid()
);
