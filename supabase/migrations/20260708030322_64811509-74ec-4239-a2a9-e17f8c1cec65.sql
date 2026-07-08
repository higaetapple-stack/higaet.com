CREATE TABLE public.admin_domain_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host text NOT NULL,
  overall text NOT NULL CHECK (overall IN ('pass','warn','fail')),
  dns_ok boolean NOT NULL,
  ssl_ok boolean NOT NULL,
  http_status int,
  hsts_present boolean NOT NULL DEFAULT false,
  hsts_max_age int,
  hsts_include_subdomains boolean NOT NULL DEFAULT false,
  cert_issuer text,
  cert_not_before timestamptz,
  cert_not_after timestamptz,
  detail text,
  checked_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.admin_domain_status_history TO authenticated;
GRANT ALL ON public.admin_domain_status_history TO service_role;

ALTER TABLE public.admin_domain_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read domain status history"
  ON public.admin_domain_status_history
  FOR SELECT
  TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::public.app_role[]));

CREATE POLICY "Admins insert domain status history"
  ON public.admin_domain_status_history
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::public.app_role[]));

CREATE INDEX admin_domain_status_history_host_checked_at_idx
  ON public.admin_domain_status_history (host, checked_at DESC);