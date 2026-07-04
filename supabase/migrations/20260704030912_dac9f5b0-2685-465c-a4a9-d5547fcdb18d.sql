
CREATE TABLE public.releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL UNIQUE,
  short_version text,
  environment text,
  deployed_at timestamptz NOT NULL,
  commit_sha text,
  commit_message text,
  author text,
  new_groups integer,
  commit_count integer NOT NULL DEFAULT 0,
  permalink text,
  notes text,
  source text NOT NULL DEFAULT 'sentry',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX releases_deployed_at_idx ON public.releases (deployed_at DESC);
CREATE INDEX releases_environment_idx ON public.releases (environment);

GRANT SELECT ON public.releases TO authenticated;
GRANT ALL ON public.releases TO service_role;

ALTER TABLE public.releases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view releases"
  ON public.releases FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER update_releases_updated_at
  BEFORE UPDATE ON public.releases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.cluster_release_correlations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id uuid NOT NULL REFERENCES public.incident_clusters(id) ON DELETE CASCADE,
  release_id uuid NOT NULL REFERENCES public.releases(id) ON DELETE CASCADE,
  regression_score integer NOT NULL DEFAULT 0,
  time_delta_seconds bigint NOT NULL DEFAULT 0,
  event_count_delta integer NOT NULL DEFAULT 0,
  first_seen_after_release boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'suspected',
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cluster_id, release_id)
);

CREATE INDEX crc_cluster_idx ON public.cluster_release_correlations (cluster_id);
CREATE INDEX crc_release_idx ON public.cluster_release_correlations (release_id);
CREATE INDEX crc_score_idx ON public.cluster_release_correlations (regression_score DESC);

GRANT SELECT ON public.cluster_release_correlations TO authenticated;
GRANT ALL ON public.cluster_release_correlations TO service_role;

ALTER TABLE public.cluster_release_correlations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view correlations"
  ON public.cluster_release_correlations FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER update_crc_updated_at
  BEFORE UPDATE ON public.cluster_release_correlations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
