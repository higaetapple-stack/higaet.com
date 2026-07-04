
CREATE TABLE public.knowledge_signature_failures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  tenant_id TEXT,
  source_label TEXT NOT NULL,
  trust_level TEXT,
  key_id TEXT,
  reason TEXT NOT NULL,
  schema_version TEXT,
  package_hash TEXT,
  generated_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  issues JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

GRANT SELECT ON public.knowledge_signature_failures TO authenticated;
GRANT ALL ON public.knowledge_signature_failures TO service_role;

ALTER TABLE public.knowledge_signature_failures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read signature failures"
ON public.knowledge_signature_failures
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
);

CREATE INDEX idx_ksf_created_at ON public.knowledge_signature_failures (created_at DESC);
CREATE INDEX idx_ksf_tenant ON public.knowledge_signature_failures (tenant_id);
CREATE INDEX idx_ksf_reason ON public.knowledge_signature_failures (reason);
