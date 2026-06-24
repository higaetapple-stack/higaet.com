
CREATE TABLE public.ci_ingest_failures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  workflow_name text,
  job_name text,
  environment text,
  ingest_url text,
  status_code integer,
  response_body text,
  correlation_id text,
  request_id text,
  retry_count integer NOT NULL DEFAULT 0,
  failure_reason text,
  payload_hash text,
  raw jsonb
);

GRANT SELECT ON public.ci_ingest_failures TO authenticated;
GRANT ALL ON public.ci_ingest_failures TO service_role;

ALTER TABLE public.ci_ingest_failures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ops can read ingest failures"
  ON public.ci_ingest_failures
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'ops')
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
  );

CREATE INDEX ci_ingest_failures_created_at_idx
  ON public.ci_ingest_failures (created_at DESC);
CREATE INDEX ci_ingest_failures_workflow_name_idx
  ON public.ci_ingest_failures (workflow_name);
CREATE INDEX ci_ingest_failures_correlation_id_idx
  ON public.ci_ingest_failures (correlation_id);

-- Retention: keep only the most recent 200 rows
CREATE OR REPLACE FUNCTION public.prune_ci_ingest_failures()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.ci_ingest_failures
  WHERE id IN (
    SELECT id FROM public.ci_ingest_failures
    ORDER BY created_at DESC
    OFFSET 200
  );
  RETURN NULL;
END;
$$;

CREATE TRIGGER ci_ingest_failures_prune
AFTER INSERT ON public.ci_ingest_failures
FOR EACH STATEMENT
EXECUTE FUNCTION public.prune_ci_ingest_failures();
