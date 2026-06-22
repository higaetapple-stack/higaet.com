-- Helper for updated_at (idempotent)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ---------- api_scopes ----------
CREATE TABLE public.api_scopes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.api_scopes TO authenticated;
GRANT ALL ON public.api_scopes TO service_role;
ALTER TABLE public.api_scopes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage api_scopes" ON public.api_scopes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated read api_scopes" ON public.api_scopes FOR SELECT TO authenticated USING (true);

-- ---------- api_keys ----------
CREATE TABLE public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  key_prefix text NOT NULL UNIQUE,
  key_hash text NOT NULL,
  owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  partner_name text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked','expired')),
  rate_limit_per_minute integer NOT NULL DEFAULT 60,
  last_used_at timestamptz,
  expires_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX api_keys_status_idx ON public.api_keys(status);
CREATE INDEX api_keys_key_hash_idx ON public.api_keys(key_hash);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_keys TO authenticated;
GRANT ALL ON public.api_keys TO service_role;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage api_keys" ON public.api_keys FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER api_keys_updated_at BEFORE UPDATE ON public.api_keys
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- api_key_scopes ----------
CREATE TABLE public.api_key_scopes (
  api_key_id uuid NOT NULL REFERENCES public.api_keys(id) ON DELETE CASCADE,
  scope_id uuid NOT NULL REFERENCES public.api_scopes(id) ON DELETE CASCADE,
  granted_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (api_key_id, scope_id)
);
GRANT SELECT, INSERT, DELETE ON public.api_key_scopes TO authenticated;
GRANT ALL ON public.api_key_scopes TO service_role;
ALTER TABLE public.api_key_scopes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage api_key_scopes" ON public.api_key_scopes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ---------- api_key_usage ----------
CREATE TABLE public.api_key_usage (
  id bigserial PRIMARY KEY,
  api_key_id uuid REFERENCES public.api_keys(id) ON DELETE SET NULL,
  request_id text,
  endpoint text NOT NULL,
  method text NOT NULL,
  status_code integer NOT NULL,
  latency_ms integer,
  bytes_out integer,
  ip inet,
  user_agent text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX api_key_usage_key_time_idx ON public.api_key_usage(api_key_id, created_at DESC);
CREATE INDEX api_key_usage_endpoint_idx ON public.api_key_usage(endpoint, created_at DESC);
GRANT SELECT ON public.api_key_usage TO authenticated;
GRANT ALL ON public.api_key_usage TO service_role;
ALTER TABLE public.api_key_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read api_key_usage" ON public.api_key_usage FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ---------- api_webhook_subscriptions ----------
CREATE TABLE public.api_webhook_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id uuid NOT NULL REFERENCES public.api_keys(id) ON DELETE CASCADE,
  url text NOT NULL,
  signing_secret text NOT NULL,
  event_types text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','disabled')),
  last_success_at timestamptz,
  last_failure_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX api_webhook_subs_key_idx ON public.api_webhook_subscriptions(api_key_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_webhook_subscriptions TO authenticated;
GRANT ALL ON public.api_webhook_subscriptions TO service_role;
ALTER TABLE public.api_webhook_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage webhook subs" ON public.api_webhook_subscriptions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER api_webhook_subs_updated_at BEFORE UPDATE ON public.api_webhook_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- api_webhook_deliveries ----------
CREATE TABLE public.api_webhook_deliveries (
  id bigserial PRIMARY KEY,
  subscription_id uuid NOT NULL REFERENCES public.api_webhook_subscriptions(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','success','failed','dead')),
  attempt integer NOT NULL DEFAULT 0,
  response_status integer,
  response_body text,
  error text,
  next_attempt_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX api_webhook_deliv_sub_idx ON public.api_webhook_deliveries(subscription_id, created_at DESC);
CREATE INDEX api_webhook_deliv_status_idx ON public.api_webhook_deliveries(status, next_attempt_at);
GRANT SELECT ON public.api_webhook_deliveries TO authenticated;
GRANT ALL ON public.api_webhook_deliveries TO service_role;
ALTER TABLE public.api_webhook_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read webhook deliveries" ON public.api_webhook_deliveries FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ---------- seed scopes ----------
INSERT INTO public.api_scopes (scope, description) VALUES
  ('read:programs', 'Read program catalog'),
  ('read:courses', 'Read course catalog'),
  ('read:certificates', 'Read and verify certificates'),
  ('read:jobs', 'Read job postings'),
  ('read:universities', 'Read partner universities'),
  ('write:applications', 'Submit applications on behalf of users')
ON CONFLICT (scope) DO NOTHING;
