
-- 1. Tier column on api_keys
ALTER TABLE public.api_keys
  ADD COLUMN IF NOT EXISTS tier text NOT NULL DEFAULT 'free'
    CHECK (tier IN ('free','partner','internal'));

-- 2. Rate limit counters table
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  api_key_id uuid NOT NULL REFERENCES public.api_keys(id) ON DELETE CASCADE,
  window_start timestamptz NOT NULL,
  request_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (api_key_id, window_start)
);

GRANT ALL ON public.api_rate_limits TO service_role;

ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role only - api_rate_limits"
  ON public.api_rate_limits FOR ALL
  USING (false) WITH CHECK (false);

CREATE INDEX IF NOT EXISTS api_rate_limits_window_idx
  ON public.api_rate_limits (window_start);

-- 3. Atomic check + increment
CREATE OR REPLACE FUNCTION public.check_api_rate_limit(
  _api_key_id uuid,
  _limit integer,
  _window_seconds integer DEFAULT 3600
)
RETURNS TABLE(allowed boolean, remaining integer, reset_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _bucket timestamptz;
  _count integer;
BEGIN
  -- Bucket aligned to the window (hour by default)
  _bucket := to_timestamp(
    floor(extract(epoch from now()) / _window_seconds) * _window_seconds
  );

  IF _limit <= 0 THEN
    -- Unlimited tier
    RETURN QUERY SELECT true, 2147483647, _bucket + make_interval(secs => _window_seconds);
    RETURN;
  END IF;

  INSERT INTO public.api_rate_limits (api_key_id, window_start, request_count, updated_at)
  VALUES (_api_key_id, _bucket, 1, now())
  ON CONFLICT (api_key_id, window_start)
  DO UPDATE SET request_count = api_rate_limits.request_count + 1,
                updated_at = now()
  RETURNING request_count INTO _count;

  RETURN QUERY SELECT
    (_count <= _limit),
    GREATEST(_limit - _count, 0),
    _bucket + make_interval(secs => _window_seconds);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.check_api_rate_limit(uuid, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_api_rate_limit(uuid, integer, integer) TO service_role;

-- 4. Cleanup function + hourly cron
CREATE OR REPLACE FUNCTION public.cleanup_api_rate_limits()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.api_rate_limits
  WHERE window_start < now() - INTERVAL '7 days';
$$;

REVOKE EXECUTE ON FUNCTION public.cleanup_api_rate_limits() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_api_rate_limits() TO service_role;

CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  PERFORM cron.unschedule('cleanup-api-rate-limits');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'cleanup-api-rate-limits',
  '7 * * * *',
  $$SELECT public.cleanup_api_rate_limits();$$
);
