
-- Revoke EXECUTE from anon/authenticated/public on trigger-only SECURITY DEFINER functions.
-- Triggers still fire normally (they run as table owner regardless of caller EXECUTE grants).

DO $$
DECLARE
  fn text;
  trigger_only_fns text[] := ARRAY[
    'tg_crm_tasks_assigned_event()',
    'tg_applications_workflow_status_audit()',
    'tg_threads_count()',
    'tg_event_rsvps_count()',
    'tg_lessons_enqueue_embedding()',
    'tech_proposals_guard_client_update()',
    'threads_guard_user_update()',
    'notifications_guard_user_update()',
    'profiles_assign_portfolio_slug()',
    'audit_certificate_changes()',
    'prevent_student_grade_tampering()',
    'update_updated_at_column()',
    'emit_domain_event(text, text, text, jsonb)',
    'ai_upsert_document_and_enqueue(text, uuid, text, text, text)',
    'ai_delete_document(text, uuid)',
    'generate_portfolio_slug(text, uuid)'
  ];
BEGIN
  FOREACH fn IN ARRAY trigger_only_fns LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC, anon, authenticated', fn);
  END LOOP;
END $$;

-- Re-grant to service_role so admin/maintenance code (and triggers run under elevated contexts) can still invoke if ever needed.
GRANT EXECUTE ON FUNCTION public.emit_domain_event(text, text, text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.ai_upsert_document_and_enqueue(text, uuid, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.ai_delete_document(text, uuid) TO service_role;
