CREATE OR REPLACE FUNCTION public.business_kpis(_hours int DEFAULT 24)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _since timestamptz := now() - make_interval(hours => greatest(1, least(_hours, 720)));
  _leads int;
  _apps_started int;
  _apps_submitted int;
  _checkouts int;
  _payments_ok int;
  _payments_failed int;
  _refunds_requested int;
  _refunds_processed int;
  _refunds_failed int;
BEGIN
  IF NOT (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Forbidden' USING errcode = '42501';
  END IF;

  SELECT count(*) INTO _leads
    FROM public.study_abroad_leads
   WHERE created_at >= _since;

  SELECT
    count(*) FILTER (WHERE created_at >= _since),
    count(*) FILTER (WHERE submitted_at IS NOT NULL AND submitted_at >= _since)
  INTO _apps_started, _apps_submitted
  FROM public.applications;

  SELECT
    count(*) FILTER (WHERE created_at >= _since),
    count(*) FILTER (WHERE created_at >= _since AND status::text = 'succeeded'),
    count(*) FILTER (WHERE created_at >= _since AND status::text = 'failed')
  INTO _checkouts, _payments_ok, _payments_failed
  FROM public.payments;

  SELECT
    count(*) FILTER (WHERE created_at >= _since),
    count(*) FILTER (WHERE created_at >= _since AND status::text = 'processed'),
    count(*) FILTER (WHERE created_at >= _since AND status::text = 'failed')
  INTO _refunds_requested, _refunds_processed, _refunds_failed
  FROM public.refunds;

  RETURN jsonb_build_object(
    'window_hours', _hours,
    'funnel', jsonb_build_object(
      'leads_captured', _leads,
      'applications_started', _apps_started,
      'applications_submitted', _apps_submitted,
      'checkouts_started', _checkouts,
      'payments_succeeded', _payments_ok,
      'payments_failed', _payments_failed,
      'refunds_requested', _refunds_requested,
      'refunds_processed', _refunds_processed,
      'refunds_failed', _refunds_failed
    ),
    'rates', jsonb_build_object(
      'lead_to_application_pct',
        CASE WHEN _leads > 0 THEN round(100.0 * _apps_started / _leads, 2) ELSE NULL END,
      'application_completion_pct',
        CASE WHEN _apps_started > 0 THEN round(100.0 * _apps_submitted / _apps_started, 2) ELSE NULL END,
      'payment_success_pct',
        CASE WHEN _checkouts > 0 THEN round(100.0 * _payments_ok / _checkouts, 2) ELSE NULL END,
      'payment_failure_pct',
        CASE WHEN _checkouts > 0 THEN round(100.0 * _payments_failed / _checkouts, 2) ELSE NULL END,
      'refund_rate_pct',
        CASE WHEN _payments_ok > 0 THEN round(100.0 * _refunds_requested / _payments_ok, 2) ELSE NULL END,
      'refund_failure_pct',
        CASE WHEN _refunds_requested > 0 THEN round(100.0 * _refunds_failed / _refunds_requested, 2) ELSE NULL END
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.business_kpis(int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.business_kpis(int) TO authenticated, service_role;