CREATE POLICY "Tech clients read own invoice pdfs"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'tech-documents'
  AND (storage.foldername(name))[1] = 'tech_invoices'
  AND EXISTS (
    SELECT 1 FROM public.tech_invoices i
    JOIN public.tech_clients c ON c.id = i.client_id
    WHERE i.id::text = (storage.foldername(objects.name))[2]
      AND c.portal_user = auth.uid()
      AND i.sent_at IS NOT NULL
  )
);

CREATE POLICY "Tech clients read own payment receipts"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'tech-documents'
  AND (storage.foldername(name))[1] = 'tech_payments'
  AND EXISTS (
    SELECT 1 FROM public.tech_payments p
    JOIN public.tech_clients c ON c.id = p.client_id
    WHERE p.id::text = (storage.foldername(objects.name))[2]
      AND c.portal_user = auth.uid()
  )
);