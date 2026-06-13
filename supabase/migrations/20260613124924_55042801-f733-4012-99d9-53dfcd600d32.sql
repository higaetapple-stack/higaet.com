
CREATE POLICY "Admins manage tech-documents storage" ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'tech-documents' AND public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]))
WITH CHECK (bucket_id = 'tech-documents' AND public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]));

CREATE POLICY "Tech clients read own proposal pdfs" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'tech-documents'
  AND (storage.foldername(name))[1] = 'proposals'
  AND EXISTS (
    SELECT 1 FROM public.tech_proposals p
    JOIN public.tech_clients c ON c.id = p.client_id
    WHERE p.id::text = (storage.foldername(name))[2]
      AND c.portal_user = auth.uid()
      AND p.status <> 'draft'
  )
);

CREATE POLICY "Tech clients read own contract pdfs" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'tech-documents'
  AND (storage.foldername(name))[1] = 'contracts'
  AND EXISTS (
    SELECT 1 FROM public.tech_contracts ct
    JOIN public.tech_clients c ON c.id = ct.client_id
    WHERE ct.id::text = (storage.foldername(name))[2]
      AND c.portal_user = auth.uid()
      AND ct.status <> 'draft'
  )
);
