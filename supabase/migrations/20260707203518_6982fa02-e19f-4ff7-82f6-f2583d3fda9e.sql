
DROP VIEW IF EXISTS public.public_profiles;

CREATE OR REPLACE FUNCTION public.get_public_portfolio_profile(_slug text)
RETURNS TABLE (
  id uuid,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  headline text,
  bio text,
  location text,
  github_url text,
  linkedin_url text,
  website_url text,
  skills text[],
  career_goals text,
  education jsonb,
  experience jsonb,
  portfolio_slug text,
  portfolio_visibility text,
  show_email boolean,
  show_phone boolean,
  show_resume boolean,
  show_certificates boolean,
  show_projects boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.full_name,
    CASE WHEN p.show_email THEN p.email ELSE NULL END,
    CASE WHEN p.show_phone THEN p.phone ELSE NULL END,
    p.avatar_url,
    p.headline,
    p.bio,
    p.location,
    p.github_url,
    p.linkedin_url,
    p.website_url,
    p.skills,
    p.career_goals,
    p.education,
    p.experience,
    p.portfolio_slug,
    p.portfolio_visibility::text,
    p.show_email,
    p.show_phone,
    p.show_resume,
    p.show_certificates,
    p.show_projects
  FROM public.profiles p
  WHERE p.portfolio_slug = _slug
    AND p.portfolio_visibility IN ('public','unlisted');
$$;

REVOKE ALL ON FUNCTION public.get_public_portfolio_profile(text) FROM public;
GRANT EXECUTE ON FUNCTION public.get_public_portfolio_profile(text) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.applications_prevent_student_crm_tampering()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_any_role(auth.uid(),
       ARRAY['admin','super_admin','counselor','placement_officer']::app_role[]) THEN
    RETURN NEW;
  END IF;
  NEW.crm_status            := OLD.crm_status;
  NEW.crm_substatus         := OLD.crm_substatus;
  NEW.workflow_status       := OLD.workflow_status;
  NEW.assigned_to_counselor := OLD.assigned_to_counselor;
  NEW.status                := OLD.status;
  NEW.offer_letter_url      := OLD.offer_letter_url;
  NEW.offer_received_at     := OLD.offer_received_at;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS applications_prevent_student_crm_tampering ON public.applications;
CREATE TRIGGER applications_prevent_student_crm_tampering
BEFORE UPDATE ON public.applications
FOR EACH ROW
EXECUTE FUNCTION public.applications_prevent_student_crm_tampering();

CREATE OR REPLACE FUNCTION public.job_applications_prevent_student_crm_tampering()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_any_role(auth.uid(),
       ARRAY['admin','super_admin','placement_officer','counselor']::app_role[]) THEN
    RETURN NEW;
  END IF;
  NEW.crm_status    := OLD.crm_status;
  NEW.crm_substatus := OLD.crm_substatus;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS job_applications_prevent_student_crm_tampering ON public.job_applications;
CREATE TRIGGER job_applications_prevent_student_crm_tampering
BEFORE UPDATE ON public.job_applications
FOR EACH ROW
EXECUTE FUNCTION public.job_applications_prevent_student_crm_tampering();

REVOKE ALL ON FUNCTION public.applications_prevent_student_crm_tampering() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.job_applications_prevent_student_crm_tampering() FROM public, anon, authenticated;
