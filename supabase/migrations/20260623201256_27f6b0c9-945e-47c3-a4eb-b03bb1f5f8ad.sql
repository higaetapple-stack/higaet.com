CREATE TABLE IF NOT EXISTS public.launch_readiness_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commit_sha text NOT NULL,
  branch text NOT NULL,
  environment text NOT NULL,
  workflow_run_id text,
  audit_errors integer NOT NULL DEFAULT 0,
  audit_warnings integer NOT NULL DEFAULT 0,
  audit_breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  playwright_passed integer NOT NULL DEFAULT 0,
  playwright_failed integer NOT NULL DEFAULT 0,
  playwright_skipped integer NOT NULL DEFAULT 0,
  playwright_duration_ms integer NOT NULL DEFAULT 0,
  security_passed integer NOT NULL DEFAULT 0,
  security_failed integer NOT NULL DEFAULT 0,
  schema_validation_status text NOT NULL DEFAULT 'unknown',
  schema_validation_details jsonb NOT NULL DEFAULT '{}'::jsonb,
  overall_status text NOT NULL DEFAULT 'unknown',
  artifact_urls jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.launch_readiness_runs TO authenticated;
GRANT ALL ON public.launch_readiness_runs TO service_role;

ALTER TABLE public.launch_readiness_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read launch readiness runs"
  ON public.launch_readiness_runs
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  );

CREATE POLICY "Service role manages launch readiness runs"
  ON public.launch_readiness_runs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_lrr_created_at ON public.launch_readiness_runs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lrr_branch ON public.launch_readiness_runs (branch);
CREATE INDEX IF NOT EXISTS idx_lrr_environment ON public.launch_readiness_runs (environment);
CREATE INDEX IF NOT EXISTS idx_lrr_overall_status ON public.launch_readiness_runs (overall_status);