
DROP VIEW IF EXISTS public.public_portfolios;

-- Restore public portfolio read, but rely on column-level grants to hide email/phone from anon.
CREATE POLICY "profiles public portfolio read"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (portfolio_visibility = 'public'::portfolio_visibility);

-- Ensure anon cannot select email or phone columns even when the row is public.
REVOKE ALL ON public.profiles FROM anon;
GRANT SELECT (
  id, full_name, avatar_url, headline, bio, location,
  github_url, linkedin_url, website_url, skills, career_goals,
  education, experience, portfolio_slug, portfolio_visibility,
  show_email, show_phone, show_resume, show_certificates, show_projects,
  featured_success_story, success_story_summary, success_story_priority,
  created_at, updated_at
) ON public.profiles TO anon;
