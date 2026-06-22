-- Phase 8B: webhook delivery worker support
ALTER TABLE public.api_webhook_deliveries
  ADD COLUMN IF NOT EXISTS leased_until timestamptz,
  ADD COLUMN IF NOT EXISTS max_attempts integer NOT NULL DEFAULT 6;

CREATE INDEX IF NOT EXISTS api_webhook_deliv_lease_idx
  ON public.api_webhook_deliveries(status, next_attempt_at, leased_until)
  WHERE status IN ('pending','failed');

-- Atomic lease: pick N pending/failed deliveries due now, mark leased
CREATE OR REPLACE FUNCTION public.lease_webhook_deliveries(_limit int, _lease_seconds int)
RETURNS SETOF public.api_webhook_deliveries
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH due AS (
    SELECT id FROM public.api_webhook_deliveries
    WHERE status IN ('pending','failed')
      AND (next_attempt_at IS NULL OR next_attempt_at <= now())
      AND (leased_until IS NULL OR leased_until <= now())
    ORDER BY created_at
    FOR UPDATE SKIP LOCKED
    LIMIT _limit
  )
  UPDATE public.api_webhook_deliveries d
  SET leased_until = now() + make_interval(secs => _lease_seconds),
      attempt = d.attempt + 1
  FROM due
  WHERE d.id = due.id
  RETURNING d.*;
END
$$;

REVOKE ALL ON FUNCTION public.lease_webhook_deliveries(int, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lease_webhook_deliveries(int, int) TO service_role;

-- Enqueue helper: fan out an event to all matching active subscriptions
CREATE OR REPLACE FUNCTION public.enqueue_webhook_event(_event_type text, _payload jsonb)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted int := 0;
BEGIN
  WITH ins AS (
    INSERT INTO public.api_webhook_deliveries (subscription_id, event_type, payload, status, next_attempt_at)
    SELECT s.id, _event_type, _payload, 'pending', now()
    FROM public.api_webhook_subscriptions s
    WHERE s.status = 'active'
      AND (_event_type = ANY(s.event_types) OR '*' = ANY(s.event_types))
    RETURNING 1
  )
  SELECT count(*)::int INTO inserted FROM ins;
  RETURN inserted;
END
$$;

REVOKE ALL ON FUNCTION public.enqueue_webhook_event(text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enqueue_webhook_event(text, jsonb) TO authenticated, service_role;