
-- 1. community_members: lock role column on self-update
DROP POLICY IF EXISTS "Users update own membership" ON public.community_members;

CREATE POLICY "Users update own membership"
ON public.community_members
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid()
  AND role = (
    SELECT cm.role FROM public.community_members cm
    WHERE cm.user_id = auth.uid()
      AND cm.community_id = community_members.community_id
  )
);

-- 2. profiles public portfolio: mask email/phone via view, drop the open row policy
DROP POLICY IF EXISTS "profiles public portfolio read" ON public.profiles;

CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = true)
AS
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
  created_at,
  updated_at,
  CASE WHEN show_email THEN email ELSE NULL END AS email,
  CASE WHEN show_phone THEN phone ELSE NULL END AS phone
FROM public.profiles
WHERE portfolio_visibility = 'public';

-- View needs its own read policy on the underlying table for anon/auth to see
-- public rows. Re-add a narrow SELECT policy scoped to the view's use case.
CREATE POLICY "profiles public portfolio read"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (portfolio_visibility = 'public');

-- Column-level: anon can no longer read raw email/phone from the base table.
REVOKE SELECT (email, phone) ON public.profiles FROM anon;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- 3. tech_support_tickets: assignee must be staff
DROP POLICY IF EXISTS "assignees view tickets" ON public.tech_support_tickets;
DROP POLICY IF EXISTS "assignees update tickets" ON public.tech_support_tickets;

CREATE POLICY "assignees view tickets"
ON public.tech_support_tickets
FOR SELECT
TO authenticated
USING (
  assigned_to = auth.uid()
  AND public.has_any_role(
    auth.uid(),
    ARRAY['admin','super_admin','counselor','placement_officer','faculty','mentor']::app_role[]
  )
);

CREATE POLICY "assignees update tickets"
ON public.tech_support_tickets
FOR UPDATE
TO authenticated
USING (
  assigned_to = auth.uid()
  AND public.has_any_role(
    auth.uid(),
    ARRAY['admin','super_admin','counselor','placement_officer','faculty','mentor']::app_role[]
  )
)
WITH CHECK (
  assigned_to = auth.uid()
  AND public.has_any_role(
    auth.uid(),
    ARRAY['admin','super_admin','counselor','placement_officer','faculty','mentor']::app_role[]
  )
);

-- 4. api_webhook_subscriptions: hide signing_secret from regular admin reads
REVOKE SELECT (signing_secret) ON public.api_webhook_subscriptions FROM authenticated;

-- Super-admin-only accessor for the secret (server-side webhook signing uses this)
CREATE OR REPLACE FUNCTION public.get_webhook_signing_secret(_subscription_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_secret text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden: super_admin required';
  END IF;

  SELECT signing_secret INTO v_secret
  FROM public.api_webhook_subscriptions
  WHERE id = _subscription_id;

  RETURN v_secret;
END;
$$;

REVOKE ALL ON FUNCTION public.get_webhook_signing_secret(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_webhook_signing_secret(uuid) TO authenticated, service_role;
