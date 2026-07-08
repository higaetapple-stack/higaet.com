
CREATE TABLE public.operator_checklist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_key TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_required BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','done','blocked','skipped')),
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  evidence_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX operator_checklist_items_sort_idx ON public.operator_checklist_items (sort_order, category);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.operator_checklist_items TO authenticated;
GRANT ALL ON public.operator_checklist_items TO service_role;

ALTER TABLE public.operator_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read checklist" ON public.operator_checklist_items
  FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'super_admin'::app_role]));

CREATE POLICY "Admins can insert checklist" ON public.operator_checklist_items
  FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'super_admin'::app_role]));

CREATE POLICY "Admins can update checklist" ON public.operator_checklist_items
  FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'super_admin'::app_role]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'super_admin'::app_role]));

CREATE POLICY "Admins can delete checklist" ON public.operator_checklist_items
  FOR DELETE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'super_admin'::app_role]));

CREATE TRIGGER operator_checklist_items_updated_at
  BEFORE UPDATE ON public.operator_checklist_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed the canonical production readiness items
INSERT INTO public.operator_checklist_items (item_key, category, title, description, is_required, sort_order) VALUES
  ('env.readiness.ready',              'Environment',   'Env Readiness dashboard verdict = ready',                'All required runtime secrets present and well-formed.', true, 10),
  ('env.readiness.report.attached',    'Environment',   'JSON readiness report attached to launch ticket',        'Download from /dashboard/admin/env-readiness and attach.', true, 20),
  ('gh.secrets.parity',                'Environment',   'GitHub Actions secret parity confirmed',                 'Production + staging environments hold matching secrets.', true, 30),
  ('gh.token.least_privilege',         'GitHub',        'GitHub token scoped to higaetapple-stack/higaet',        'contents R/W, pull_requests R/W, metadata R, checks R, actions R, statuses R.', true, 40),
  ('gh.token.rotation',                'GitHub',        'Token expiry documented + rotation reminder set',        'See rotation calendar in launch report.', true, 50),
  ('supabase.migrations.applied',      'Backend',       'All Supabase migrations applied',                        'supabase--migration diff is empty.', true, 60),
  ('supabase.rls.all_public_tables',   'Backend',       'RLS enabled on all exposed tables',                      'No anonymous data leaks.', true, 70),
  ('supabase.auth.providers',          'Backend',       'Auth providers verified (email, Google, Apple, MFA)',    'Sign-in flows tested end-to-end.', true, 80),
  ('supabase.backup.verified',         'Backend',       'Backup schedule + restore drill verified',               'See docs/supabase-backup-restore-verification.md.', true, 90),
  ('staging.dns',                      'Staging',       'staging.higaet.com DNS + SSL + HTTPS redirect',          'Node runtime healthy, env vars loaded.', true, 100),
  ('staging.health',                   'Staging',       'staging health endpoint responds 200 healthy=true',      'Use dashboard probe.', true, 110),
  ('prod.homepage',                    'Production',    'higaet.com homepage SSR + SEO + sitemap + robots',       'Visually verify + view-source.', true, 120),
  ('prod.health',                      'Production',    'production health endpoint responds 200 healthy=true',   'Use dashboard probe.', true, 130),
  ('sre.e2e.staging.passed',           'SRE',           'SRE E2E workflow_dispatch PASS against staging',         'Attach run URL.', true, 140),
  ('sre.e2e.prod.passed',              'SRE',           'SRE E2E workflow_dispatch PASS against production',      'Attach run URL.', true, 150),
  ('monitoring.sentry.prod_dsn',       'Monitoring',    'Sentry production DSN active + alert test received',     'Verify in Sentry project settings.', true, 160),
  ('monitoring.datadog.synthetics',    'Monitoring',    'Datadog synthetic monitors enabled for / and /api/public/sre/e2e-health', 'Uptime + SSL expiry alerts configured.', true, 170),
  ('monitoring.uptime.alerts',         'Monitoring',    'Uptime alerts wired (503, downtime, SSL, failed workflow)', 'Route to on-call channel.', true, 180),
  ('dns.spf_dkim_dmarc',               'DNS',           'SPF, DKIM, DMARC published for higaet.com',              'DMARC at least p=quarantine.', true, 190),
  ('dns.hsts',                         'DNS',           'HSTS enabled with includeSubDomains',                    '12-month max-age.', true, 200),
  ('dr.runbooks_reviewed',             'DR',            'DR runbooks reviewed by on-call',                        'database-restore, incident-response, security-incident.', true, 210),
  ('report.exported',                  'Sign-off',      'Final production launch report exported + archived',     'JSON + PDF bundle from dashboard.', true, 220);
