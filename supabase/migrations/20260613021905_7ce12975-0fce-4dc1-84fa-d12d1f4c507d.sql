
-- Enums
DO $$ BEGIN
  CREATE TYPE public.submission_status AS ENUM ('pending','reviewed','passed','failed','needs_revision');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.submission_type AS ENUM ('file','github','portfolio','text','mixed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.project_submission_status AS ENUM ('draft','submitted','reviewed','passed','failed','needs_revision');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Assignments: required flag + instructions
ALTER TABLE public.assignments
  ADD COLUMN IF NOT EXISTS is_required boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS instructions text,
  ADD COLUMN IF NOT EXISTS allowed_types public.submission_type[] NOT NULL DEFAULT ARRAY['file','github','portfolio','text']::public.submission_type[];

-- Submissions: add structured fields
ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS submission_type public.submission_type NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS external_url text,
  ADD COLUMN IF NOT EXISTS status public.submission_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS graded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Faculty grading policy on submissions (assigned faculty for the course)
DROP POLICY IF EXISTS "submissions faculty read" ON public.submissions;
CREATE POLICY "submissions faculty read" ON public.submissions
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.assignments a
    JOIN public.course_faculty cf ON cf.course_id = a.course_id
    WHERE a.id = submissions.assignment_id AND cf.faculty_id = auth.uid()
  ));

DROP POLICY IF EXISTS "submissions faculty grade" ON public.submissions;
CREATE POLICY "submissions faculty grade" ON public.submissions
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.assignments a
    JOIN public.course_faculty cf ON cf.course_id = a.course_id
    WHERE a.id = submissions.assignment_id AND cf.faculty_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.assignments a
    JOIN public.course_faculty cf ON cf.course_id = a.course_id
    WHERE a.id = submissions.assignment_id AND cf.faculty_id = auth.uid()
  ));

-- Certificates: verification + revocation
ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS verification_hash text,
  ADD COLUMN IF NOT EXISTS issued_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS revoked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS revoked_at timestamptz,
  ADD COLUMN IF NOT EXISTS revoked_reason text;

-- Public certificate verification (SECURITY DEFINER, no PII beyond name+program)
CREATE OR REPLACE FUNCTION public.verify_certificate(_number text)
RETURNS TABLE (
  certificate_number text,
  student_name text,
  program_title text,
  issued_at timestamptz,
  revoked boolean,
  verification_hash text
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.certificate_number, p.full_name, pr.title, c.issued_at, c.revoked, c.verification_hash
  FROM public.certificates c
  JOIN public.profiles p ON p.id = c.student_id
  JOIN public.programs pr ON pr.id = c.program_id
  WHERE c.certificate_number = _number;
$$;
GRANT EXECUTE ON FUNCTION public.verify_certificate(text) TO anon, authenticated;

-- Projects (capstone)
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  title text NOT NULL,
  brief text,
  guidelines text,
  due_at timestamptz,
  is_required boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projects admin full" ON public.projects
  FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]));
CREATE POLICY "projects read enrolled" ON public.projects
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.enrollments e
    WHERE e.program_id = projects.program_id AND e.student_id = auth.uid()
  ));
CREATE TRIGGER projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Project submissions
CREATE TABLE IF NOT EXISTS public.project_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  repo_url text,
  demo_url text,
  summary text,
  status public.project_submission_status NOT NULL DEFAULT 'submitted',
  score integer,
  feedback text,
  graded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  graded_at timestamptz,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, student_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_submissions TO authenticated;
GRANT ALL ON public.project_submissions TO service_role;
ALTER TABLE public.project_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "psub admin full" ON public.project_submissions
  FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]));
CREATE POLICY "psub self all" ON public.project_submissions
  FOR ALL TO authenticated
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);
CREATE POLICY "psub faculty read" ON public.project_submissions
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.projects pr
    JOIN public.courses c ON c.program_id = pr.program_id
    JOIN public.course_faculty cf ON cf.course_id = c.id
    WHERE pr.id = project_submissions.project_id AND cf.faculty_id = auth.uid()
  ));
CREATE POLICY "psub faculty grade" ON public.project_submissions
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.projects pr
    JOIN public.courses c ON c.program_id = pr.program_id
    JOIN public.course_faculty cf ON cf.course_id = c.id
    WHERE pr.id = project_submissions.project_id AND cf.faculty_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.projects pr
    JOIN public.courses c ON c.program_id = pr.program_id
    JOIN public.course_faculty cf ON cf.course_id = c.id
    WHERE pr.id = project_submissions.project_id AND cf.faculty_id = auth.uid()
  ));
CREATE TRIGGER project_submissions_updated_at BEFORE UPDATE ON public.project_submissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Helper: check eligibility (100% lessons + all required assignments passed)
CREATE OR REPLACE FUNCTION public.is_program_eligible(_student uuid, _program uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH lesson_total AS (
    SELECT count(*)::int AS n FROM public.lessons l
    JOIN public.courses c ON c.id = l.course_id
    WHERE c.program_id = _program AND c.status = 'published'
  ),
  lesson_done AS (
    SELECT count(*)::int AS n FROM public.progress p
    JOIN public.lessons l ON l.id = p.lesson_id
    JOIN public.courses c ON c.id = l.course_id
    WHERE c.program_id = _program AND c.status = 'published'
      AND p.student_id = _student AND p.completed = true
  ),
  req_total AS (
    SELECT count(*)::int AS n FROM public.assignments a
    JOIN public.courses c ON c.id = a.course_id
    WHERE c.program_id = _program AND a.is_required = true
  ),
  req_passed AS (
    SELECT count(DISTINCT a.id)::int AS n FROM public.assignments a
    JOIN public.courses c ON c.id = a.course_id
    JOIN public.submissions s ON s.assignment_id = a.id
    WHERE c.program_id = _program AND a.is_required = true
      AND s.student_id = _student AND s.status = 'passed'
  )
  SELECT (SELECT n FROM lesson_total) > 0
     AND (SELECT n FROM lesson_total) = (SELECT n FROM lesson_done)
     AND (SELECT n FROM req_total) = (SELECT n FROM req_passed);
$$;
GRANT EXECUTE ON FUNCTION public.is_program_eligible(uuid, uuid) TO authenticated, service_role;
