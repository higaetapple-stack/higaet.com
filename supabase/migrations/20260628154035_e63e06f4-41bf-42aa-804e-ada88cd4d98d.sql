
-- Fix 1: event_rsvps overly permissive SELECT
DROP POLICY IF EXISTS "RSVPs readable by authenticated" ON public.event_rsvps;

-- Fix 2: profiles public portfolio exposes email/phone — replace with view
DROP POLICY IF EXISTS "profiles public portfolio read" ON public.profiles;

CREATE OR REPLACE VIEW public.public_portfolios
WITH (security_invoker = false) AS
SELECT
  id,
  full_name,
  avatar_url,
  headline,
  bio,
  location,
  github_url,
  linkedin_url,
  website_url,
  skills,
  career_goals,
  education,
  experience,
  portfolio_slug,
  portfolio_visibility,
  show_email,
  show_phone,
  show_resume,
  show_certificates,
  show_projects,
  featured_success_story,
  success_story_summary,
  success_story_priority,
  CASE WHEN show_email THEN email ELSE NULL END AS email,
  CASE WHEN show_phone THEN phone ELSE NULL END AS phone
FROM public.profiles
WHERE portfolio_visibility = 'public';

GRANT SELECT ON public.public_portfolios TO anon, authenticated;
