
CREATE TABLE public.sentry_pull_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  issue_id TEXT NOT NULL,
  analysis_hash TEXT,
  branch_name TEXT NOT NULL,
  base_branch TEXT NOT NULL DEFAULT 'main',
  repo TEXT NOT NULL,
  pr_number INTEGER,
  pr_url TEXT,
  pr_state TEXT NOT NULL DEFAULT 'pending',
  confidence_score NUMERIC(4,3) NOT NULL DEFAULT 0,
  requires_human_review BOOLEAN NOT NULL DEFAULT TRUE,
  labels TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  title TEXT NOT NULL,
  body TEXT,
  commit_sha TEXT,
  last_error TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (issue_id, analysis_hash)
);

CREATE UNIQUE INDEX sentry_pull_requests_branch_key ON public.sentry_pull_requests (repo, branch_name);
CREATE INDEX sentry_pull_requests_issue_idx ON public.sentry_pull_requests (issue_id);
CREATE INDEX sentry_pull_requests_state_idx ON public.sentry_pull_requests (pr_state, created_at DESC);

GRANT SELECT ON public.sentry_pull_requests TO authenticated;
GRANT ALL ON public.sentry_pull_requests TO service_role;

ALTER TABLE public.sentry_pull_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view sentry pull requests"
  ON public.sentry_pull_requests
  FOR SELECT
  TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'super_admin'::app_role]));

CREATE TRIGGER sentry_pull_requests_updated_at
  BEFORE UPDATE ON public.sentry_pull_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
