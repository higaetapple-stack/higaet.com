
-- Phase 1A: Identity & Security Foundation

-- 1. MFA recovery codes (TOTP factor itself is managed by Supabase Auth)
CREATE TABLE public.user_mfa_recovery_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash text NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_user_mfa_recovery_codes_user ON public.user_mfa_recovery_codes(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_mfa_recovery_codes TO authenticated;
GRANT ALL ON public.user_mfa_recovery_codes TO service_role;
ALTER TABLE public.user_mfa_recovery_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own recovery codes" ON public.user_mfa_recovery_codes
  FOR SELECT TO authenticated USING (user_id = auth.uid());
-- writes only via service_role (server fn) — no insert/update/delete policies for authenticated

-- 2. Security events (audit trail; feeds Phase 3A notifications)
CREATE TABLE public.security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL, -- mfa.enrolled, mfa.disabled, session.revoked, password.changed, password.reset, sso.linked, sso.unlinked, login.failed, login.suspicious, role.changed, recovery_code.used
  severity text NOT NULL DEFAULT 'info', -- info, warning, critical
  ip_address inet,
  user_agent text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_security_events_user ON public.security_events(user_id, created_at DESC);
CREATE INDEX idx_security_events_type ON public.security_events(event_type, created_at DESC);
GRANT SELECT ON public.security_events TO authenticated;
GRANT ALL ON public.security_events TO service_role;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own security events" ON public.security_events
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins read all security events" ON public.security_events
  FOR SELECT TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'super_admin'::app_role]));

-- 3. SSO scaffolding: identity providers + SAML configurations + domain mappings
CREATE TABLE public.identity_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE, -- 'entra-higaet', 'okta-acme'
  display_name text NOT NULL,
  protocol text NOT NULL DEFAULT 'saml', -- saml | oidc
  enabled boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb, -- entity_id, acs_url, sso_url, x509_cert (when activated)
  metadata_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.identity_providers TO authenticated;
GRANT ALL ON public.identity_providers TO service_role;
ALTER TABLE public.identity_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authed can view enabled IdPs" ON public.identity_providers
  FOR SELECT TO authenticated USING (enabled = true);
CREATE POLICY "Admins manage identity providers" ON public.identity_providers
  FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'super_admin'::app_role]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'super_admin'::app_role]));
CREATE TRIGGER trg_identity_providers_updated BEFORE UPDATE ON public.identity_providers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.sso_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.identity_providers(id) ON DELETE CASCADE,
  domain citext NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_sso_domains_provider ON public.sso_domains(provider_id);
GRANT SELECT ON public.sso_domains TO authenticated;
GRANT ALL ON public.sso_domains TO service_role;
ALTER TABLE public.sso_domains ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authed can view sso domains" ON public.sso_domains
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage sso domains" ON public.sso_domains
  FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'super_admin'::app_role]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'super_admin'::app_role]));

-- 4. Seed Entra scaffold (disabled until metadata URL provided)
INSERT INTO public.identity_providers (slug, display_name, protocol, enabled, metadata)
VALUES ('entra-higaet', 'Microsoft Entra ID (HIGAET)', 'saml', false,
        jsonb_build_object('status','scaffolded','notes','Add metadata_url + domains to activate.'));
