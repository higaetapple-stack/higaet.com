
CREATE TABLE IF NOT EXISTS public.ci_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ts timestamptz NOT NULL,
  sha text NOT NULL,
  branch text NOT NULL,
  actor text,
  run_url text,
  decision text NOT NULL,
  decision_source text,
  decision_reason text,
  executed boolean NOT NULL DEFAULT false,
  execute_reason text,
  system_health_score int,
  risk_level text,
  platform_state text,
  system_mode text,
  autonomous_mode text,
  diagnosis text,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (sha, ts, decision)
);

CREATE INDEX IF NOT EXISTS ci_audit_log_ts_idx ON public.ci_audit_log (ts DESC);
CREATE INDEX IF NOT EXISTS ci_audit_log_decision_idx ON public.ci_audit_log (decision);
CREATE INDEX IF NOT EXISTS ci_audit_log_diagnosis_idx ON public.ci_audit_log (diagnosis);

GRANT SELECT ON public.ci_audit_log TO authenticated;
GRANT ALL ON public.ci_audit_log TO service_role;

ALTER TABLE public.ci_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ops_can_read_ci_audit"
  ON public.ci_audit_log
  FOR SELECT
  TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'super_admin'::app_role, 'ops'::app_role]));
