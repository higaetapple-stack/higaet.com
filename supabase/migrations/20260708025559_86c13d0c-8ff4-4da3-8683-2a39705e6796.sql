CREATE TABLE public.admin_integration_secrets (
  key text PRIMARY KEY,
  value text NOT NULL,
  last_verified_at timestamptz,
  last_verified_ok boolean,
  last_verified_detail text,
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_integration_secrets TO authenticated;
GRANT ALL ON public.admin_integration_secrets TO service_role;

ALTER TABLE public.admin_integration_secrets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage integration secrets"
ON public.admin_integration_secrets
FOR ALL
TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::public.app_role[]))
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::public.app_role[]));

CREATE TRIGGER admin_integration_secrets_updated_at
BEFORE UPDATE ON public.admin_integration_secrets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();