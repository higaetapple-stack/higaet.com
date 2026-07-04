
CREATE TABLE public.sentry_webhook_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source TEXT NOT NULL DEFAULT 'sentry',
  event_type TEXT NOT NULL,
  dedupe_key TEXT NOT NULL UNIQUE,
  issue_id TEXT,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  next_retry_at TIMESTAMPTZ,
  locked_at TIMESTAMPTZ,
  locked_by TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT sentry_webhook_queue_status_chk
    CHECK (status IN ('pending','processing','completed','failed','failed_permanent'))
);

CREATE INDEX sentry_webhook_queue_ready_idx
  ON public.sentry_webhook_queue (status, next_retry_at)
  WHERE status IN ('pending','failed');

CREATE INDEX sentry_webhook_queue_issue_idx
  ON public.sentry_webhook_queue (issue_id);

GRANT SELECT ON public.sentry_webhook_queue TO authenticated;
GRANT ALL ON public.sentry_webhook_queue TO service_role;

ALTER TABLE public.sentry_webhook_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read webhook queue"
  ON public.sentry_webhook_queue
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER sentry_webhook_queue_updated_at
  BEFORE UPDATE ON public.sentry_webhook_queue
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
