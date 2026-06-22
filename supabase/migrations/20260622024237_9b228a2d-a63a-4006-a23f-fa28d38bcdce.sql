
-- Phase 9A Step 1+2: Unified workflow status + status history + domain events

DO $$ BEGIN
  CREATE TYPE public.application_workflow_status AS ENUM (
    'lead','qualified','documents_pending','application_submitted',
    'offer_received','visa_processing','completed','closed_lost'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS workflow_status public.application_workflow_status;

UPDATE public.applications
SET workflow_status = CASE
  WHEN status IN ('lead','new') THEN 'lead'::public.application_workflow_status
  WHEN status IN ('qualified','contacted') THEN 'qualified'::public.application_workflow_status
  WHEN status IN ('documents_pending','docs_pending','pending_docs') THEN 'documents_pending'::public.application_workflow_status
  WHEN status IN ('application_submitted','submitted','applied') THEN 'application_submitted'::public.application_workflow_status
  WHEN status IN ('offer_received','offer','accepted_offer') THEN 'offer_received'::public.application_workflow_status
  WHEN status IN ('visa_processing','visa') THEN 'visa_processing'::public.application_workflow_status
  WHEN status IN ('completed','enrolled') THEN 'completed'::public.application_workflow_status
  WHEN status IN ('closed_lost','rejected','withdrawn','lost') THEN 'closed_lost'::public.application_workflow_status
  ELSE 'lead'::public.application_workflow_status
END
WHERE workflow_status IS NULL;

ALTER TABLE public.applications
  ALTER COLUMN workflow_status SET NOT NULL,
  ALTER COLUMN workflow_status SET DEFAULT 'lead'::public.application_workflow_status;

CREATE INDEX IF NOT EXISTS idx_applications_workflow_status ON public.applications(workflow_status);

CREATE TABLE IF NOT EXISTS public.application_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  from_status public.application_workflow_status,
  to_status public.application_workflow_status NOT NULL,
  changed_by uuid,
  reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.application_status_history TO authenticated;
GRANT ALL ON public.application_status_history TO service_role;

ALTER TABLE public.application_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "students view own application history" ON public.application_status_history;
CREATE POLICY "students view own application history"
  ON public.application_status_history FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.id = application_status_history.application_id
        AND a.student_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "staff view all application history" ON public.application_status_history;
CREATE POLICY "staff view all application history"
  ON public.application_status_history FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'super_admin'::app_role,'counselor'::app_role]));

DROP POLICY IF EXISTS "staff insert application history" ON public.application_status_history;
CREATE POLICY "staff insert application history"
  ON public.application_status_history FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'super_admin'::app_role,'counselor'::app_role]));

CREATE INDEX IF NOT EXISTS idx_app_status_history_app ON public.application_status_history(application_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.tg_applications_workflow_status_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.application_status_history(application_id, from_status, to_status, changed_by)
    VALUES (NEW.id, NULL, NEW.workflow_status, auth.uid());

    PERFORM public.emit_domain_event(
      'application.updated','application', NEW.id::text,
      jsonb_build_object('status', NEW.workflow_status, 'student_id', NEW.student_id)
    );
    RETURN NEW;
  END IF;

  IF NEW.workflow_status IS DISTINCT FROM OLD.workflow_status THEN
    INSERT INTO public.application_status_history(application_id, from_status, to_status, changed_by)
    VALUES (NEW.id, OLD.workflow_status, NEW.workflow_status, auth.uid());

    PERFORM public.emit_domain_event(
      'application.status_changed','application', NEW.id::text,
      jsonb_build_object(
        'from', OLD.workflow_status,
        'to', NEW.workflow_status,
        'student_id', NEW.student_id,
        'counselor_id', NEW.assigned_to_counselor
      )
    );

    IF NEW.workflow_status = 'offer_received' THEN
      PERFORM public.emit_domain_event(
        'offer.received','application', NEW.id::text,
        jsonb_build_object('student_id', NEW.student_id, 'university_id', NEW.university_id, 'program_id', NEW.program_id)
      );
    ELSIF NEW.workflow_status = 'documents_pending' THEN
      PERFORM public.emit_domain_event(
        'document.required','application', NEW.id::text,
        jsonb_build_object('student_id', NEW.student_id)
      );
    ELSIF NEW.workflow_status = 'visa_processing' THEN
      PERFORM public.emit_domain_event(
        'visa.reminder','application', NEW.id::text,
        jsonb_build_object('student_id', NEW.student_id)
      );
    END IF;
  ELSE
    IF NEW.assigned_to_counselor IS DISTINCT FROM OLD.assigned_to_counselor
       OR NEW.intake IS DISTINCT FROM OLD.intake
       OR NEW.notes IS DISTINCT FROM OLD.notes THEN
      PERFORM public.emit_domain_event(
        'application.updated','application', NEW.id::text,
        jsonb_build_object('student_id', NEW.student_id, 'status', NEW.workflow_status)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS tg_applications_workflow_audit_ins ON public.applications;
CREATE TRIGGER tg_applications_workflow_audit_ins
  AFTER INSERT ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.tg_applications_workflow_status_audit();

DROP TRIGGER IF EXISTS tg_applications_workflow_audit_upd ON public.applications;
CREATE TRIGGER tg_applications_workflow_audit_upd
  AFTER UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.tg_applications_workflow_status_audit();

INSERT INTO public.application_status_history(application_id, from_status, to_status, changed_by, created_at)
SELECT a.id, NULL, a.workflow_status, a.student_id, a.created_at
FROM public.applications a
LEFT JOIN public.application_status_history h ON h.application_id = a.id
WHERE h.id IS NULL;

-- crm_tasks: emit task.assigned (column is assigned_to, not assignee_id)
CREATE OR REPLACE FUNCTION public.tg_crm_tasks_assigned_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.assigned_to IS NOT NULL THEN
    PERFORM public.emit_domain_event(
      'task.assigned','crm_task', NEW.id::text,
      jsonb_build_object('assigned_to', NEW.assigned_to, 'title', NEW.title, 'due_date', NEW.due_date, 'entity_type', NEW.entity_type, 'entity_id', NEW.entity_id)
    );
  ELSIF TG_OP = 'UPDATE' AND NEW.assigned_to IS DISTINCT FROM OLD.assigned_to AND NEW.assigned_to IS NOT NULL THEN
    PERFORM public.emit_domain_event(
      'task.assigned','crm_task', NEW.id::text,
      jsonb_build_object('assigned_to', NEW.assigned_to, 'title', NEW.title, 'due_date', NEW.due_date, 'entity_type', NEW.entity_type, 'entity_id', NEW.entity_id)
    );
  END IF;
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS tg_crm_tasks_assigned_event ON public.crm_tasks;
CREATE TRIGGER tg_crm_tasks_assigned_event
  AFTER INSERT OR UPDATE OF assigned_to ON public.crm_tasks
  FOR EACH ROW EXECUTE FUNCTION public.tg_crm_tasks_assigned_event();
