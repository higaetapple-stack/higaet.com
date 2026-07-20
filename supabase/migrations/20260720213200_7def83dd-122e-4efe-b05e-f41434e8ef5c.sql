-- Rebuild the safe listing view in invoker mode so it doesn't run as owner
-- (Supabase flags security-definer views as ERROR).
DROP VIEW IF EXISTS public.identity_providers_public;

CREATE VIEW public.identity_providers_public
WITH (security_invoker = true) AS
SELECT id, slug, display_name, protocol, enabled
FROM public.identity_providers
WHERE enabled = true;

GRANT SELECT ON public.identity_providers_public TO authenticated, anon;

-- Restore a narrow SELECT policy on the base table for enabled providers,
-- but restrict column visibility so metadata / metadata_url are admin-only.
CREATE POLICY "Authed can view enabled IdP discovery fields"
  ON public.identity_providers
  FOR SELECT
  TO authenticated
  USING (enabled = true);

-- Revoke broad column access, then grant only non-sensitive columns to
-- authenticated. Admins/super_admins reach metadata via the admin-managed
-- server function (uses service role), not via PostgREST.
REVOKE SELECT ON public.identity_providers FROM authenticated;
GRANT SELECT (id, slug, display_name, protocol, enabled)
  ON public.identity_providers TO authenticated;

-- Keep full access for service_role (admin server functions).
GRANT ALL ON public.identity_providers TO service_role;