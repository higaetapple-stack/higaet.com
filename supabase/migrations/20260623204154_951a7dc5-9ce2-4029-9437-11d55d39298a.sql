
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS method text,
  ADD COLUMN IF NOT EXISTS proof_url text,
  ADD COLUMN IF NOT EXISTS reference text,
  ADD COLUMN IF NOT EXISTS payer_notes text,
  ADD COLUMN IF NOT EXISTS verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejection_reason text;

DROP POLICY IF EXISTS "Users submit manual payments" ON public.payments;
CREATE POLICY "Users submit manual payments"
ON public.payments
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND provider = 'manual'::public.payment_provider
  AND status = 'pending_verification'::public.payment_status
);

DROP POLICY IF EXISTS "Admins update payments" ON public.payments;
CREATE POLICY "Admins update payments"
ON public.payments
FOR UPDATE
TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'super_admin'::app_role]))
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'super_admin'::app_role]));

DROP POLICY IF EXISTS "Users upload own payment proofs" ON storage.objects;
CREATE POLICY "Users upload own payment proofs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'payment-proofs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users read own payment proofs" ON storage.objects;
CREATE POLICY "Users read own payment proofs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-proofs'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'super_admin'::app_role])
  )
);
