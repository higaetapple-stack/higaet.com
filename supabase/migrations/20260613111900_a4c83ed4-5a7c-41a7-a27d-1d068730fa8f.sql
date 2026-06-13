-- Success story fields on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS featured_success_story boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS success_story_summary text,
  ADD COLUMN IF NOT EXISTS success_story_priority integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_profiles_featured_story
  ON public.profiles (featured_success_story, success_story_priority DESC)
  WHERE featured_success_story = true;

-- Placements
CREATE TABLE IF NOT EXISTS public.placements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  employer_id uuid REFERENCES public.employers(id) ON DELETE SET NULL,
  job_posting_id uuid REFERENCES public.job_postings(id) ON DELETE SET NULL,
  program_id uuid REFERENCES public.programs(id) ON DELETE SET NULL,
  job_title text NOT NULL,
  salary_package numeric(12,2),
  salary_currency text NOT NULL DEFAULT 'INR',
  employment_type text NOT NULL DEFAULT 'full_time',
  offer_date date,
  joining_date date,
  status text NOT NULL DEFAULT 'offered',
  verified boolean NOT NULL DEFAULT false,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.placements TO authenticated;
GRANT ALL ON public.placements TO service_role;

ALTER TABLE public.placements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage placements" ON public.placements
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Students view their placements" ON public.placements
  FOR SELECT TO authenticated
  USING (student_id = auth.uid());

CREATE TRIGGER trg_placements_updated_at
  BEFORE UPDATE ON public.placements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_placements_student ON public.placements(student_id);
CREATE INDEX IF NOT EXISTS idx_placements_employer ON public.placements(employer_id);
CREATE INDEX IF NOT EXISTS idx_placements_verified ON public.placements(verified) WHERE verified = true;