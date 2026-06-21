CREATE POLICY "Authenticated can read active ai_collections"
ON public.ai_collections
FOR SELECT
TO authenticated
USING (is_active = true);