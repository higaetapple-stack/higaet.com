
-- Extensions
CREATE EXTENSION IF NOT EXISTS citext;

-- Enums
DO $$ BEGIN CREATE TYPE public.portfolio_visibility AS ENUM ('private','unlisted','public'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.job_remote_type AS ENUM ('onsite','hybrid','remote'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.job_employment_type AS ENUM ('full_time','part_time','contract','internship'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.job_experience_level AS ENUM ('entry','mid','senior'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.job_status AS ENUM ('draft','open','closed','archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.application_status AS ENUM ('submitted','under_review','shortlisted','rejected','withdrawn','hired'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── PROFILES additions ──────────────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS github_url text,
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS website_url text,
  ADD COLUMN IF NOT EXISTS skills text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS career_goals text,
  ADD COLUMN IF NOT EXISTS education jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS experience jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS portfolio_slug citext,
  ADD COLUMN IF NOT EXISTS portfolio_visibility public.portfolio_visibility NOT NULL DEFAULT 'private',
  ADD COLUMN IF NOT EXISTS show_email boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_phone boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_resume boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_certificates boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_projects boolean NOT NULL DEFAULT true;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_portfolio_slug_key ON public.profiles (portfolio_slug) WHERE portfolio_slug IS NOT NULL;

-- slug generator
CREATE OR REPLACE FUNCTION public.generate_portfolio_slug(_full_name text, _id uuid)
RETURNS text LANGUAGE plpgsql SET search_path = public AS $$
DECLARE base text; candidate text; n int := 0;
BEGIN
  base := regexp_replace(lower(coalesce(_full_name, '')), '[^a-z0-9]+', '-', 'g');
  base := trim(both '-' from base);
  IF base IS NULL OR length(base) < 3 THEN base := 'student-' || substr(_id::text, 1, 8); END IF;
  IF length(base) > 40 THEN base := substr(base, 1, 40); END IF;
  candidate := base;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE portfolio_slug = candidate AND id <> _id) LOOP
    n := n + 1; candidate := base || '-' || n;
  END LOOP;
  RETURN candidate;
END $$;

-- auto-assign slug when going public/unlisted
CREATE OR REPLACE FUNCTION public.profiles_assign_portfolio_slug()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.portfolio_visibility IN ('public','unlisted') AND NEW.portfolio_slug IS NULL THEN
    NEW.portfolio_slug := public.generate_portfolio_slug(NEW.full_name, NEW.id);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS profiles_assign_portfolio_slug ON public.profiles;
CREATE TRIGGER profiles_assign_portfolio_slug BEFORE INSERT OR UPDATE OF portfolio_visibility, portfolio_slug ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_assign_portfolio_slug();

-- allow anon to see public portfolios (column-level safety enforced by server fn)
GRANT SELECT ON public.profiles TO anon;
DROP POLICY IF EXISTS "profiles public portfolio read" ON public.profiles;
CREATE POLICY "profiles public portfolio read" ON public.profiles
  FOR SELECT TO anon, authenticated
  USING (portfolio_visibility = 'public');

-- ── EMPLOYERS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.employers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  website text,
  logo_url text,
  description text,
  industry text,
  hq_location text,
  size text,
  verified boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.employers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employers TO authenticated;
GRANT ALL ON public.employers TO service_role;
ALTER TABLE public.employers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "employers public read" ON public.employers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "employers admin write" ON public.employers FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','placement_officer']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','placement_officer']::app_role[]));
CREATE TRIGGER employers_updated_at BEFORE UPDATE ON public.employers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── JOB POSTINGS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.job_postings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id uuid NOT NULL REFERENCES public.employers(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text NOT NULL,
  requirements text,
  responsibilities text,
  location text,
  remote_type public.job_remote_type NOT NULL DEFAULT 'onsite',
  employment_type public.job_employment_type NOT NULL DEFAULT 'full_time',
  experience_level public.job_experience_level NOT NULL DEFAULT 'entry',
  salary_min int,
  salary_max int,
  salary_currency text NOT NULL DEFAULT 'INR',
  skills text[] NOT NULL DEFAULT '{}',
  apply_url text,
  status public.job_status NOT NULL DEFAULT 'draft',
  posted_at timestamptz,
  closes_at timestamptz,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS job_postings_status_idx ON public.job_postings (status, posted_at DESC);
CREATE INDEX IF NOT EXISTS job_postings_employer_idx ON public.job_postings (employer_id);
GRANT SELECT ON public.job_postings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_postings TO authenticated;
GRANT ALL ON public.job_postings TO service_role;
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "jobs public open read" ON public.job_postings FOR SELECT TO anon, authenticated USING (status = 'open');
CREATE POLICY "jobs admin all" ON public.job_postings FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','placement_officer']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','placement_officer']::app_role[]));
CREATE TRIGGER job_postings_updated_at BEFORE UPDATE ON public.job_postings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── JOB APPLICATIONS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  resume_snapshot jsonb,
  cover_letter text,
  portfolio_url text,
  status public.application_status NOT NULL DEFAULT 'submitted',
  notes text,
  applied_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id, student_id)
);
CREATE INDEX IF NOT EXISTS job_applications_student_idx ON public.job_applications (student_id, applied_at DESC);
CREATE INDEX IF NOT EXISTS job_applications_job_idx ON public.job_applications (job_id, status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_applications TO authenticated;
GRANT ALL ON public.job_applications TO service_role;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "applications student own" ON public.job_applications FOR ALL TO authenticated
  USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());
CREATE POLICY "applications staff read" ON public.job_applications FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['faculty','placement_officer','admin','super_admin']::app_role[]));
CREATE POLICY "applications admin write" ON public.job_applications FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['placement_officer','admin','super_admin']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['placement_officer','admin','super_admin']::app_role[]));
CREATE TRIGGER job_applications_updated_at BEFORE UPDATE ON public.job_applications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── SAVED JOBS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.saved_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
  saved_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, job_id)
);
GRANT SELECT, INSERT, DELETE ON public.saved_jobs TO authenticated;
GRANT ALL ON public.saved_jobs TO service_role;
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saved_jobs student own" ON public.saved_jobs FOR ALL TO authenticated
  USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());
