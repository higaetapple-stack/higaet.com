
-- governance_audit_events
CREATE TABLE public.governance_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  tenant_id TEXT,
  source TEXT NOT NULL,
  decision TEXT NOT NULL,
  risk_score INTEGER NOT NULL DEFAULT 0,
  confidence NUMERIC NOT NULL DEFAULT 0,
  explanation JSONB NOT NULL DEFAULT '[]'::jsonb,
  requires_human_approval BOOLEAN NOT NULL DEFAULT false,
  approval_status TEXT NOT NULL DEFAULT 'auto',
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX gae_created_idx ON public.governance_audit_events (created_at DESC);
CREATE INDEX gae_tenant_idx ON public.governance_audit_events (tenant_id);
CREATE INDEX gae_decision_idx ON public.governance_audit_events (decision);
CREATE INDEX gae_approval_idx ON public.governance_audit_events (approval_status);

GRANT SELECT ON public.governance_audit_events TO authenticated;
GRANT ALL ON public.governance_audit_events TO service_role;
ALTER TABLE public.governance_audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gae_admin_select" ON public.governance_audit_events
  FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'super_admin'::app_role]));

-- knowledge_packages
CREATE TABLE public.knowledge_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source_label TEXT NOT NULL,
  trust_level TEXT NOT NULL,
  schema_version TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  hash TEXT NOT NULL,
  signature_valid BOOLEAN NOT NULL DEFAULT false,
  payload JSONB NOT NULL,
  categories JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT
);
CREATE INDEX kp_status_idx ON public.knowledge_packages (status);
CREATE INDEX kp_created_idx ON public.knowledge_packages (created_at DESC);

GRANT SELECT ON public.knowledge_packages TO authenticated;
GRANT ALL ON public.knowledge_packages TO service_role;
ALTER TABLE public.knowledge_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kp_admin_select" ON public.knowledge_packages
  FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'super_admin'::app_role]));

-- knowledge_ingestion_events
CREATE TABLE public.knowledge_ingestion_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  package_id UUID REFERENCES public.knowledge_packages(id) ON DELETE SET NULL,
  source_label TEXT NOT NULL,
  trust_level TEXT NOT NULL,
  outcome TEXT NOT NULL,
  reason TEXT,
  issues JSONB NOT NULL DEFAULT '[]'::jsonb
);
CREATE INDEX kie_created_idx ON public.knowledge_ingestion_events (created_at DESC);
CREATE INDEX kie_outcome_idx ON public.knowledge_ingestion_events (outcome);

GRANT SELECT ON public.knowledge_ingestion_events TO authenticated;
GRANT ALL ON public.knowledge_ingestion_events TO service_role;
ALTER TABLE public.knowledge_ingestion_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kie_admin_select" ON public.knowledge_ingestion_events
  FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'super_admin'::app_role]));

CREATE TRIGGER kp_updated_at
  BEFORE UPDATE ON public.knowledge_packages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
