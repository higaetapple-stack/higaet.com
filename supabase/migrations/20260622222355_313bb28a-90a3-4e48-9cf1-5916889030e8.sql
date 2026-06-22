
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_can_receive_own_or_public" ON realtime.messages;
CREATE POLICY "authenticated_can_receive_own_or_public"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  (topic LIKE 'notifications:%' AND split_part(topic, ':', 2) = auth.uid()::text)
  OR (topic LIKE 'user:%' AND split_part(topic, ':', 2) = auth.uid()::text)
  OR topic LIKE 'thread:%'
  OR topic LIKE 'lesson-threads:%'
  OR topic IN ('events','announcements','system')
);

DROP POLICY IF EXISTS "Authenticated users can view all rsvps" ON public.event_rsvps;
DROP POLICY IF EXISTS "Anyone authenticated can view rsvps" ON public.event_rsvps;
DROP POLICY IF EXISTS "rsvps_select_all" ON public.event_rsvps;
DROP POLICY IF EXISTS "users_view_own_rsvps" ON public.event_rsvps;

CREATE POLICY "users_view_own_rsvps"
ON public.event_rsvps
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_any_role(auth.uid(), ARRAY['admin','super_admin','faculty','counselor']::app_role[])
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'event_rsvps'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.event_rsvps';
  END IF;
END $$;

DROP POLICY IF EXISTS "students_view_own_certificates" ON storage.objects;
DROP POLICY IF EXISTS "admins_manage_certificates" ON storage.objects;

CREATE POLICY "students_view_own_certificates"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'certificates'
  AND (
    EXISTS (
      SELECT 1 FROM public.certificates c
      WHERE c.issued_pdf_path = storage.objects.name
        AND c.student_id = auth.uid()
    )
    OR public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[])
  )
);

CREATE POLICY "admins_manage_certificates"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'certificates'
  AND public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[])
)
WITH CHECK (
  bucket_id = 'certificates'
  AND public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[])
);

ALTER FUNCTION public.tg_events_validate() SET search_path = public;
