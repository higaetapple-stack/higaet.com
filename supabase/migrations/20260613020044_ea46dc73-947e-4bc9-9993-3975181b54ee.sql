
-- Programs: thumbnail + featured
ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT false;

-- Courses: status
DO $$ BEGIN
  CREATE TYPE public.course_status AS ENUM ('draft','published','archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS status public.course_status NOT NULL DEFAULT 'draft';

-- Lessons: resources + preview
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS resources JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS preview BOOLEAN NOT NULL DEFAULT false;

-- course_faculty join
CREATE TABLE IF NOT EXISTS public.course_faculty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  faculty_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (course_id, faculty_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_faculty TO authenticated;
GRANT ALL ON public.course_faculty TO service_role;

ALTER TABLE public.course_faculty ENABLE ROW LEVEL SECURITY;

CREATE POLICY "course_faculty admin full" ON public.course_faculty
  FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'super_admin'::app_role]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'super_admin'::app_role]));

CREATE POLICY "course_faculty self read" ON public.course_faculty
  FOR SELECT TO authenticated
  USING (faculty_id = auth.uid());

-- certificate_templates
CREATE TABLE IF NOT EXISTS public.certificate_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  template_html TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.certificate_templates TO authenticated;
GRANT ALL ON public.certificate_templates TO service_role;

ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cert_templates admin full" ON public.certificate_templates
  FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'super_admin'::app_role]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'super_admin'::app_role]));

CREATE POLICY "cert_templates read published program" ON public.certificate_templates
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.programs p WHERE p.id = certificate_templates.program_id AND p.status = 'published'::program_status));

CREATE TRIGGER certificate_templates_updated_at
  BEFORE UPDATE ON public.certificate_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
