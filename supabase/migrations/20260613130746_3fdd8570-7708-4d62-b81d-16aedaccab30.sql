
CREATE TYPE public.tech_invoice_status AS ENUM ('draft','sent','partially_paid','paid','overdue','cancelled');
CREATE TYPE public.tech_payment_status AS ENUM ('pending','received','failed','refunded');
CREATE TYPE public.tech_payment_method AS ENUM ('bank_transfer','upi','card','cash','cheque','other');
CREATE TYPE public.tech_request_type AS ENUM ('feature','change','enhancement','consultation','bug','other');
CREATE TYPE public.tech_request_status AS ENUM ('new','in_review','approved','rejected','in_progress','completed');
CREATE TYPE public.tech_priority AS ENUM ('low','medium','high','critical');
CREATE TYPE public.tech_ticket_status AS ENUM ('open','assigned','in_progress','waiting_client','resolved','closed');

CREATE TABLE public.tech_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.tech_clients(id) ON DELETE CASCADE,
  contract_id uuid REFERENCES public.tech_contracts(id) ON DELETE SET NULL,
  project_id uuid REFERENCES public.tech_projects(id) ON DELETE SET NULL,
  invoice_number text NOT NULL UNIQUE,
  status public.tech_invoice_status NOT NULL DEFAULT 'draft',
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  currency text NOT NULL DEFAULT 'USD',
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  tax numeric(12,2) NOT NULL DEFAULT 0,
  discount numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL DEFAULT 0,
  amount_paid numeric(12,2) NOT NULL DEFAULT 0,
  notes text,
  payment_instructions text,
  pdf_url text,
  pdf_generated_at timestamptz,
  sent_at timestamptz,
  paid_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_tech_invoices_client ON public.tech_invoices(client_id);
CREATE INDEX idx_tech_invoices_status ON public.tech_invoices(status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tech_invoices TO authenticated;
GRANT ALL ON public.tech_invoices TO service_role;
ALTER TABLE public.tech_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage invoices" ON public.tech_invoices FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]));
CREATE POLICY "tech client views own invoices" ON public.tech_invoices FOR SELECT TO authenticated
  USING (status <> 'draft' AND client_id IN (SELECT id FROM public.tech_clients WHERE portal_user = auth.uid()));
CREATE TRIGGER trg_tech_invoices_updated BEFORE UPDATE ON public.tech_invoices FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.tech_invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.tech_invoices(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity numeric(12,2) NOT NULL DEFAULT 1,
  unit_price numeric(12,2) NOT NULL DEFAULT 0,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_tech_invoice_items_invoice ON public.tech_invoice_items(invoice_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tech_invoice_items TO authenticated;
GRANT ALL ON public.tech_invoice_items TO service_role;
ALTER TABLE public.tech_invoice_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage invoice items" ON public.tech_invoice_items FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]));
CREATE POLICY "tech client views own invoice items" ON public.tech_invoice_items FOR SELECT TO authenticated
  USING (invoice_id IN (
    SELECT i.id FROM public.tech_invoices i JOIN public.tech_clients c ON c.id = i.client_id
    WHERE i.status <> 'draft' AND c.portal_user = auth.uid()
  ));

CREATE TABLE public.tech_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.tech_clients(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  method public.tech_payment_method NOT NULL DEFAULT 'bank_transfer',
  reference text,
  paid_on date NOT NULL DEFAULT CURRENT_DATE,
  status public.tech_payment_status NOT NULL DEFAULT 'pending',
  receipt_url text,
  notes text,
  verified_at timestamptz,
  verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_tech_payments_client ON public.tech_payments(client_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tech_payments TO authenticated;
GRANT ALL ON public.tech_payments TO service_role;
ALTER TABLE public.tech_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage payments" ON public.tech_payments FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]));
CREATE POLICY "tech client views own payments" ON public.tech_payments FOR SELECT TO authenticated
  USING (client_id IN (SELECT id FROM public.tech_clients WHERE portal_user = auth.uid()));
CREATE POLICY "tech client uploads payment" ON public.tech_payments FOR INSERT TO authenticated
  WITH CHECK (
    client_id IN (SELECT id FROM public.tech_clients WHERE portal_user = auth.uid())
    AND status = 'pending' AND created_by = auth.uid()
  );
CREATE TRIGGER trg_tech_payments_updated BEFORE UPDATE ON public.tech_payments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.tech_payment_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL REFERENCES public.tech_payments(id) ON DELETE CASCADE,
  invoice_id uuid NOT NULL REFERENCES public.tech_invoices(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(payment_id, invoice_id)
);
CREATE INDEX idx_tech_alloc_invoice ON public.tech_payment_allocations(invoice_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tech_payment_allocations TO authenticated;
GRANT ALL ON public.tech_payment_allocations TO service_role;
ALTER TABLE public.tech_payment_allocations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage payment allocations" ON public.tech_payment_allocations FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]));
CREATE POLICY "tech client views own allocations" ON public.tech_payment_allocations FOR SELECT TO authenticated
  USING (invoice_id IN (
    SELECT i.id FROM public.tech_invoices i JOIN public.tech_clients c ON c.id = i.client_id
    WHERE c.portal_user = auth.uid()
  ));

CREATE TABLE public.tech_client_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.tech_clients(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.tech_projects(id) ON DELETE SET NULL,
  type public.tech_request_type NOT NULL DEFAULT 'feature',
  title text NOT NULL,
  description text,
  priority public.tech_priority NOT NULL DEFAULT 'medium',
  status public.tech_request_status NOT NULL DEFAULT 'new',
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_tech_requests_client ON public.tech_client_requests(client_id);
CREATE INDEX idx_tech_requests_status ON public.tech_client_requests(status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tech_client_requests TO authenticated;
GRANT ALL ON public.tech_client_requests TO service_role;
ALTER TABLE public.tech_client_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage requests" ON public.tech_client_requests FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]));
CREATE POLICY "tech client views own requests" ON public.tech_client_requests FOR SELECT TO authenticated
  USING (client_id IN (SELECT id FROM public.tech_clients WHERE portal_user = auth.uid()));
CREATE POLICY "tech client creates requests" ON public.tech_client_requests FOR INSERT TO authenticated
  WITH CHECK (
    client_id IN (SELECT id FROM public.tech_clients WHERE portal_user = auth.uid())
    AND created_by = auth.uid()
  );
CREATE TRIGGER trg_tech_requests_updated BEFORE UPDATE ON public.tech_client_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.tech_request_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.tech_client_requests(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  internal boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_tech_req_comments_request ON public.tech_request_comments(request_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tech_request_comments TO authenticated;
GRANT ALL ON public.tech_request_comments TO service_role;
ALTER TABLE public.tech_request_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage request comments" ON public.tech_request_comments FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]));
CREATE POLICY "client views non-internal comments" ON public.tech_request_comments FOR SELECT TO authenticated
  USING (
    NOT internal AND request_id IN (
      SELECT r.id FROM public.tech_client_requests r JOIN public.tech_clients c ON c.id = r.client_id
      WHERE c.portal_user = auth.uid()
    )
  );
CREATE POLICY "client posts comments" ON public.tech_request_comments FOR INSERT TO authenticated
  WITH CHECK (
    NOT internal AND author_id = auth.uid() AND request_id IN (
      SELECT r.id FROM public.tech_client_requests r JOIN public.tech_clients c ON c.id = r.client_id
      WHERE c.portal_user = auth.uid()
    )
  );

CREATE TABLE public.tech_request_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.tech_client_requests(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  storage_path text NOT NULL,
  mime_type text,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tech_request_attachments TO authenticated;
GRANT ALL ON public.tech_request_attachments TO service_role;
ALTER TABLE public.tech_request_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage request attachments" ON public.tech_request_attachments FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]));
CREATE POLICY "client views own request attachments" ON public.tech_request_attachments FOR SELECT TO authenticated
  USING (request_id IN (
    SELECT r.id FROM public.tech_client_requests r JOIN public.tech_clients c ON c.id = r.client_id
    WHERE c.portal_user = auth.uid()
  ));
CREATE POLICY "client adds own request attachments" ON public.tech_request_attachments FOR INSERT TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid() AND request_id IN (
      SELECT r.id FROM public.tech_client_requests r JOIN public.tech_clients c ON c.id = r.client_id
      WHERE c.portal_user = auth.uid()
    )
  );

CREATE TABLE public.tech_support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.tech_clients(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.tech_projects(id) ON DELETE SET NULL,
  ticket_number text NOT NULL UNIQUE,
  subject text NOT NULL,
  description text,
  priority public.tech_priority NOT NULL DEFAULT 'medium',
  status public.tech_ticket_status NOT NULL DEFAULT 'open',
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_tech_tickets_client ON public.tech_support_tickets(client_id);
CREATE INDEX idx_tech_tickets_status ON public.tech_support_tickets(status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tech_support_tickets TO authenticated;
GRANT ALL ON public.tech_support_tickets TO service_role;
ALTER TABLE public.tech_support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage tickets" ON public.tech_support_tickets FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]));
CREATE POLICY "assignees view tickets" ON public.tech_support_tickets FOR SELECT TO authenticated
  USING (assigned_to = auth.uid());
CREATE POLICY "assignees update tickets" ON public.tech_support_tickets FOR UPDATE TO authenticated
  USING (assigned_to = auth.uid()) WITH CHECK (assigned_to = auth.uid());
CREATE POLICY "tech client views own tickets" ON public.tech_support_tickets FOR SELECT TO authenticated
  USING (client_id IN (SELECT id FROM public.tech_clients WHERE portal_user = auth.uid()));
CREATE POLICY "tech client creates tickets" ON public.tech_support_tickets FOR INSERT TO authenticated
  WITH CHECK (
    client_id IN (SELECT id FROM public.tech_clients WHERE portal_user = auth.uid())
    AND created_by = auth.uid() AND status = 'open'
  );
CREATE TRIGGER trg_tech_tickets_updated BEFORE UPDATE ON public.tech_support_tickets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.tech_ticket_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.tech_support_tickets(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  internal boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_tech_ticket_comments_ticket ON public.tech_ticket_comments(ticket_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tech_ticket_comments TO authenticated;
GRANT ALL ON public.tech_ticket_comments TO service_role;
ALTER TABLE public.tech_ticket_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage ticket comments" ON public.tech_ticket_comments FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]));
CREATE POLICY "assignees read ticket comments" ON public.tech_ticket_comments FOR SELECT TO authenticated
  USING (ticket_id IN (SELECT id FROM public.tech_support_tickets WHERE assigned_to = auth.uid()));
CREATE POLICY "assignees post ticket comments" ON public.tech_ticket_comments FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND ticket_id IN (SELECT id FROM public.tech_support_tickets WHERE assigned_to = auth.uid()));
CREATE POLICY "client views non-internal ticket comments" ON public.tech_ticket_comments FOR SELECT TO authenticated
  USING (
    NOT internal AND ticket_id IN (
      SELECT t.id FROM public.tech_support_tickets t JOIN public.tech_clients c ON c.id = t.client_id
      WHERE c.portal_user = auth.uid()
    )
  );
CREATE POLICY "client posts ticket comments" ON public.tech_ticket_comments FOR INSERT TO authenticated
  WITH CHECK (
    NOT internal AND author_id = auth.uid() AND ticket_id IN (
      SELECT t.id FROM public.tech_support_tickets t JOIN public.tech_clients c ON c.id = t.client_id
      WHERE c.portal_user = auth.uid()
    )
  );

CREATE TABLE public.tech_ticket_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.tech_support_tickets(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  storage_path text NOT NULL,
  mime_type text,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tech_ticket_attachments TO authenticated;
GRANT ALL ON public.tech_ticket_attachments TO service_role;
ALTER TABLE public.tech_ticket_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage ticket attachments" ON public.tech_ticket_attachments FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]));
CREATE POLICY "assignees view ticket attachments" ON public.tech_ticket_attachments FOR SELECT TO authenticated
  USING (ticket_id IN (SELECT id FROM public.tech_support_tickets WHERE assigned_to = auth.uid()));
CREATE POLICY "client views own ticket attachments" ON public.tech_ticket_attachments FOR SELECT TO authenticated
  USING (ticket_id IN (
    SELECT t.id FROM public.tech_support_tickets t JOIN public.tech_clients c ON c.id = t.client_id
    WHERE c.portal_user = auth.uid()
  ));
CREATE POLICY "client adds own ticket attachments" ON public.tech_ticket_attachments FOR INSERT TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid() AND ticket_id IN (
      SELECT t.id FROM public.tech_support_tickets t JOIN public.tech_clients c ON c.id = t.client_id
      WHERE c.portal_user = auth.uid()
    )
  );
