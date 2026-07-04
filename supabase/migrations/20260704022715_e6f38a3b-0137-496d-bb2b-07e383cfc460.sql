CREATE TABLE public.sentry_issue_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id text NOT NULL UNIQUE,
  short_id text,
  title text NOT NULL,
  sentry_permalink text,
  category text,
  confidence numeric,
  risk_score numeric,
  root_cause jsonb,
  fix_plan jsonb,
  pr_suggestion jsonb,
  auto_pr_recommended boolean NOT NULL DEFAULT false,
  analysis_hash text,
  status text NOT NULL DEFAULT 'processed',
  error text,
  trigger text NOT NULL DEFAULT 'manual',
  analyzed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sentry_issue_analyses_created_at ON public.sentry_issue_analyses (created_at DESC, id DESC);
CREATE INDEX idx_sentry_issue_analyses_status ON public.sentry_issue_analyses (status);
CREATE INDEX idx_sentry_issue_analyses_trigger ON public.sentry_issue_analyses (trigger);
CREATE INDEX idx_sentry_issue_analyses_auto_pr ON public.sentry_issue_analyses (auto_pr_recommended) WHERE auto_pr_recommended = true;

GRANT SELECT ON public.sentry_issue_analyses TO authenticated;
GRANT ALL ON public.sentry_issue_analyses TO service_role;

ALTER TABLE public.sentry_issue_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view sentry analyses"
  ON public.sentry_issue_analyses
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  );

CREATE TRIGGER update_sentry_issue_analyses_updated_at
  BEFORE UPDATE ON public.sentry_issue_analyses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();