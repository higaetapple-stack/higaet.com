
-- Snapshots of env readiness (presence-only)
CREATE TABLE public.env_readiness_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  environment TEXT NOT NULL,
  overall TEXT NOT NULL CHECK (overall IN ('ready','degraded','blocked')),
  present_count INT NOT NULL DEFAULT 0,
  missing_count INT NOT NULL DEFAULT 0,
  malformed_count INT NOT NULL DEFAULT 0,
  blocking_missing_count INT NOT NULL DEFAULT 0,
  totals JSONB NOT NULL,
  groups JSONB NOT NULL,
  source TEXT NOT NULL DEFAULT 'cron'
);
CREATE INDEX env_readiness_snapshots_created_at_idx
  ON public.env_readiness_snapshots (created_at DESC);

GRANT SELECT ON public.env_readiness_snapshots TO authenticated;
GRANT ALL ON public.env_readiness_snapshots TO service_role;
ALTER TABLE public.env_readiness_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read env readiness snapshots"
  ON public.env_readiness_snapshots FOR SELECT
  TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]));

-- Activity log: views + state changes
CREATE TABLE public.env_readiness_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('viewed','state_changed','recheck_forced')),
  previous_overall TEXT,
  next_overall TEXT,
  detail JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX env_readiness_activity_created_at_idx
  ON public.env_readiness_activity (created_at DESC);

GRANT SELECT ON public.env_readiness_activity TO authenticated;
GRANT ALL ON public.env_readiness_activity TO service_role;
ALTER TABLE public.env_readiness_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read env readiness activity"
  ON public.env_readiness_activity FOR SELECT
  TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]));

-- Ensure extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the 15-minute recheck against the public hook endpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'env-readiness-recheck-15m') THEN
    PERFORM cron.unschedule('env-readiness-recheck-15m');
  END IF;
END $$;

SELECT cron.schedule(
  'env-readiness-recheck-15m',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://project--019358d1-d5d3-491a-8f03-bd2f647a26b3.lovable.app/api/public/hooks/env-readiness-recheck',
    headers := '{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhiZHdmZWtobmdocndydGVxdHZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNTc1NjUsImV4cCI6MjA5NzYzMzU2NX0.HhFj_s-biYAAfTePFibWDwQ0Gk6B9e2CFFZbE83zDRA"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
