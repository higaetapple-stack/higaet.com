
CREATE TABLE public.incident_clusters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signature text NOT NULL UNIQUE,
  title text NOT NULL,
  top_category text,
  severity_score integer NOT NULL DEFAULT 0,
  issue_count integer NOT NULL DEFAULT 0,
  event_count bigint NOT NULL DEFAULT 0,
  user_count integer NOT NULL DEFAULT 0,
  first_seen timestamptz NOT NULL DEFAULT now(),
  last_seen timestamptz NOT NULL DEFAULT now(),
  representative_issue_id text,
  last_analysis_hash text,
  last_analyzed_at timestamptz,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX incident_clusters_last_seen_idx ON public.incident_clusters (last_seen DESC);
CREATE INDEX incident_clusters_severity_idx ON public.incident_clusters (severity_score DESC);
CREATE INDEX incident_clusters_status_idx ON public.incident_clusters (status);

GRANT SELECT ON public.incident_clusters TO authenticated;
GRANT ALL ON public.incident_clusters TO service_role;

ALTER TABLE public.incident_clusters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view incident clusters"
  ON public.incident_clusters FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER update_incident_clusters_updated_at
  BEFORE UPDATE ON public.incident_clusters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.sentry_issue_analyses
  ADD COLUMN cluster_id uuid REFERENCES public.incident_clusters(id) ON DELETE SET NULL,
  ADD COLUMN signature text;

CREATE INDEX sentry_issue_analyses_cluster_idx ON public.sentry_issue_analyses (cluster_id);
CREATE INDEX sentry_issue_analyses_signature_idx ON public.sentry_issue_analyses (signature);
