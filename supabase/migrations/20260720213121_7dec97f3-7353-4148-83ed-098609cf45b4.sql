-- Restrict identity_providers row access. The prior policy exposed the full row
-- (including SAML/OIDC metadata + metadata_url) to any authenticated user.
-- Replace with a safe view exposing only non-sensitive discovery fields.

DROP POLICY IF EXISTS "Anyone authed can view enabled IdPs" ON public.identity_providers;

CREATE OR REPLACE VIEW public.identity_providers_public
WITH (security_invoker = false) AS
SELECT id, slug, display_name, protocol, enabled
FROM public.identity_providers
WHERE enabled = true;

GRANT SELECT ON public.identity_providers_public TO authenticated, anon;