
-- CI check runs observed on AI-generated PRs
CREATE TABLE public.sentry_pr_check_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pull_request_id uuid NOT NULL REFERENCES public.sentry_pull_requests(id) ON DELETE CASCADE,
  check_name text NOT NULL,
  status text NOT NULL,          -- queued | in_progress | completed
  conclusion text,               -- success | failure | neutral | cancelled | timed_out | action_required | skipped
  details_url text,
  head_sha text,
  external_id text,
  started_at timestamptz,
  completed_at timestamptz,
  observed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pull_request_id, check_name, head_sha)
);

GRANT SELECT ON public.sentry_pr_check_runs TO authenticated;
GRANT ALL ON public.sentry_pr_check_runs TO service_role;

ALTER TABLE public.sentry_pr_check_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view PR check runs"
  ON public.sentry_pr_check_runs FOR SELECT
  TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'super_admin'::app_role]));

CREATE TRIGGER sentry_pr_check_runs_updated_at
  BEFORE UPDATE ON public.sentry_pr_check_runs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX sentry_pr_check_runs_pr_idx ON public.sentry_pr_check_runs(pull_request_id, observed_at DESC);

-- Aggregate CI status columns on the PR itself
ALTER TABLE public.sentry_pull_requests
  ADD COLUMN IF NOT EXISTS ci_status text NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS ci_conclusion text,
  ADD COLUMN IF NOT EXISTS ci_last_checked_at timestamptz,
  ADD COLUMN IF NOT EXISTS ci_head_sha text;

-- End-to-end pipeline smoke tests
CREATE TABLE public.sre_e2e_test_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  triggered_by uuid,
  status text NOT NULL DEFAULT 'running', -- running | passed | failed
  current_phase text,
  phases jsonb NOT NULL DEFAULT '[]'::jsonb, -- [{phase, status, message, at}]
  sample_issue_id text,
  pull_request_id uuid REFERENCES public.sentry_pull_requests(id) ON DELETE SET NULL,
  pr_url text,
  ci_conclusion text,
  ready_for_deploy boolean,
  error text,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.sre_e2e_test_runs TO authenticated;
GRANT ALL ON public.sre_e2e_test_runs TO service_role;

ALTER TABLE public.sre_e2e_test_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view e2e test runs"
  ON public.sre_e2e_test_runs FOR SELECT
  TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'super_admin'::app_role]));

CREATE TRIGGER sre_e2e_test_runs_updated_at
  BEFORE UPDATE ON public.sre_e2e_test_runs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX sre_e2e_test_runs_status_idx ON public.sre_e2e_test_runs(status, started_at DESC);
