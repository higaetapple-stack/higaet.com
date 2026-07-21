DROP POLICY IF EXISTS "Anyone authed can view enabled IdPs" ON public.identity_providers;
DROP POLICY IF EXISTS "Authed can view enabled IdP discovery fields" ON public.identity_providers;

REVOKE ALL PRIVILEGES ON TABLE public.identity_providers FROM anon, authenticated;
GRANT ALL ON TABLE public.identity_providers TO service_role;

REVOKE ALL PRIVILEGES ON TABLE public.identity_providers_public FROM anon, authenticated;
GRANT ALL ON TABLE public.identity_providers_public TO service_role;