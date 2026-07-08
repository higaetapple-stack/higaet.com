-- Grant Data API access to admin tables. RLS policies already restrict to admin/super_admin.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.operator_checklist_items TO authenticated;
GRANT ALL ON public.operator_checklist_items TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_integration_secrets TO authenticated;
GRANT ALL ON public.admin_integration_secrets TO service_role;

GRANT SELECT, INSERT ON public.admin_domain_status_history TO authenticated;
GRANT ALL ON public.admin_domain_status_history TO service_role;