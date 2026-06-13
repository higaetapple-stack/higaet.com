
CREATE TYPE public.tech_proposal_status AS ENUM ('draft','sent','viewed','negotiation','accepted','rejected','expired');
CREATE TYPE public.tech_contract_status AS ENUM ('draft','sent','signed','active','completed','terminated');

CREATE TABLE public.tech_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.tech_clients(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.tech_projects(id) ON DELETE SET NULL,
  title text NOT NULL,
  summary text,
  status public.tech_proposal_status NOT NULL DEFAULT 'draft',
  total_amount numeric(12,2),
  currency text DEFAULT 'USD',
  valid_until date,
  current_version int NOT NULL DEFAULT 1,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sent_at timestamptz,
  viewed_at timestamptz,
  responded_at timestamptz,
  client_response_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tech_proposals TO authenticated;
GRANT ALL ON public.tech_proposals TO service_role;
ALTER TABLE public.tech_proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage proposals" ON public.tech_proposals FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]));
CREATE POLICY "Tech clients view own proposals" ON public.tech_proposals FOR SELECT TO authenticated
  USING (status <> 'draft' AND EXISTS (SELECT 1 FROM public.tech_clients c WHERE c.id = tech_proposals.client_id AND c.portal_user = auth.uid()));
CREATE POLICY "Tech clients update response" ON public.tech_proposals FOR UPDATE TO authenticated
  USING (status IN ('sent','viewed','negotiation') AND EXISTS (SELECT 1 FROM public.tech_clients c WHERE c.id = tech_proposals.client_id AND c.portal_user = auth.uid()));
CREATE TRIGGER set_tech_proposals_updated_at BEFORE UPDATE ON public.tech_proposals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.tech_proposal_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES public.tech_proposals(id) ON DELETE CASCADE,
  version int NOT NULL,
  executive_summary text,
  scope_of_work text,
  deliverables text,
  timeline text,
  pricing text,
  terms text,
  pdf_url text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (proposal_id, version)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tech_proposal_versions TO authenticated;
GRANT ALL ON public.tech_proposal_versions TO service_role;
ALTER TABLE public.tech_proposal_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage proposal versions" ON public.tech_proposal_versions FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]));
CREATE POLICY "Tech clients view versions of own proposals" ON public.tech_proposal_versions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tech_proposals p JOIN public.tech_clients c ON c.id = p.client_id
    WHERE p.id = tech_proposal_versions.proposal_id AND c.portal_user = auth.uid() AND p.status <> 'draft'));

CREATE TABLE public.tech_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid REFERENCES public.tech_proposals(id) ON DELETE SET NULL,
  client_id uuid NOT NULL REFERENCES public.tech_clients(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.tech_projects(id) ON DELETE SET NULL,
  title text NOT NULL,
  status public.tech_contract_status NOT NULL DEFAULT 'draft',
  effective_date date,
  end_date date,
  total_amount numeric(12,2),
  currency text DEFAULT 'USD',
  parties text,
  scope text,
  deliverables text,
  payment_terms text,
  confidentiality text,
  termination text,
  pdf_url text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sent_at timestamptz,
  signed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tech_contracts TO authenticated;
GRANT ALL ON public.tech_contracts TO service_role;
ALTER TABLE public.tech_contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage contracts" ON public.tech_contracts FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]));
CREATE POLICY "Tech clients view own contracts" ON public.tech_contracts FOR SELECT TO authenticated
  USING (status <> 'draft' AND EXISTS (SELECT 1 FROM public.tech_clients c WHERE c.id = tech_contracts.client_id AND c.portal_user = auth.uid()));
CREATE TRIGGER set_tech_contracts_updated_at BEFORE UPDATE ON public.tech_contracts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.tech_contract_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.tech_contracts(id) ON DELETE CASCADE,
  document_type text,
  file_name text,
  file_url text NOT NULL,
  visible_to_client boolean NOT NULL DEFAULT true,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tech_contract_documents TO authenticated;
GRANT ALL ON public.tech_contract_documents TO service_role;
ALTER TABLE public.tech_contract_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage contract docs" ON public.tech_contract_documents FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]));
CREATE POLICY "Tech clients view shared contract docs" ON public.tech_contract_documents FOR SELECT TO authenticated
  USING (visible_to_client = true AND EXISTS (SELECT 1 FROM public.tech_contracts ct JOIN public.tech_clients cl ON cl.id = ct.client_id
    WHERE ct.id = tech_contract_documents.contract_id AND cl.portal_user = auth.uid() AND ct.status <> 'draft'));

CREATE INDEX idx_tech_proposals_client ON public.tech_proposals(client_id);
CREATE INDEX idx_tech_proposals_status ON public.tech_proposals(status);
CREATE INDEX idx_tech_contracts_client ON public.tech_contracts(client_id);
CREATE INDEX idx_tech_contracts_proposal ON public.tech_contracts(proposal_id);
CREATE INDEX idx_tech_contract_docs_contract ON public.tech_contract_documents(contract_id);
CREATE INDEX idx_tech_proposal_versions_proposal ON public.tech_proposal_versions(proposal_id);
