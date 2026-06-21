
-- Tech clients: upload + read attachments under tech_requests/<request_id>/...
CREATE POLICY "Tech clients upload own request attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'tech-documents'
  AND (storage.foldername(name))[1] = 'tech_requests'
  AND EXISTS (
    SELECT 1 FROM public.tech_client_requests r
    JOIN public.tech_clients c ON c.id = r.client_id
    WHERE r.id::text = (storage.foldername(name))[2]
      AND c.portal_user = auth.uid()
  )
);

CREATE POLICY "Tech clients read own request attachments"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'tech-documents'
  AND (storage.foldername(name))[1] = 'tech_requests'
  AND EXISTS (
    SELECT 1 FROM public.tech_client_requests r
    JOIN public.tech_clients c ON c.id = r.client_id
    WHERE r.id::text = (storage.foldername(name))[2]
      AND c.portal_user = auth.uid()
  )
);

-- Tech clients: upload + read attachments under tech_tickets/<ticket_id>/...
CREATE POLICY "Tech clients upload own ticket attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'tech-documents'
  AND (storage.foldername(name))[1] = 'tech_tickets'
  AND EXISTS (
    SELECT 1 FROM public.tech_support_tickets t
    JOIN public.tech_clients c ON c.id = t.client_id
    WHERE t.id::text = (storage.foldername(name))[2]
      AND c.portal_user = auth.uid()
  )
);

CREATE POLICY "Tech clients read own ticket attachments"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'tech-documents'
  AND (storage.foldername(name))[1] = 'tech_tickets'
  AND EXISTS (
    SELECT 1 FROM public.tech_support_tickets t
    JOIN public.tech_clients c ON c.id = t.client_id
    WHERE t.id::text = (storage.foldername(name))[2]
      AND c.portal_user = auth.uid()
  )
);

-- Tech clients: upload payment receipts under tech_payments/<payment_id>/...
-- (read policy already exists: "Tech clients read own payment receipts")
CREATE POLICY "Tech clients upload own payment receipts"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'tech-documents'
  AND (storage.foldername(name))[1] = 'tech_payments'
  AND EXISTS (
    SELECT 1 FROM public.tech_payments p
    JOIN public.tech_clients c ON c.id = p.client_id
    WHERE p.id::text = (storage.foldername(name))[2]
      AND c.portal_user = auth.uid()
  )
);
