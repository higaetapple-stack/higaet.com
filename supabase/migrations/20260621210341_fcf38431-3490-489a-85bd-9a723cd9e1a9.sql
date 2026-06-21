
-- M2a: Add verification token, QR URL, PDF path to certificates; backfill; audit hooks
ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS verification_token text UNIQUE,
  ADD COLUMN IF NOT EXISTS qr_code_url text,
  ADD COLUMN IF NOT EXISTS issued_pdf_path text;

-- Backfill verification_token for existing rows
UPDATE public.certificates
SET verification_token = encode(gen_random_bytes(16), 'hex')
WHERE verification_token IS NULL;

-- Default for new rows
ALTER TABLE public.certificates
  ALTER COLUMN verification_token SET DEFAULT encode(gen_random_bytes(16), 'hex');

ALTER TABLE public.certificates
  ALTER COLUMN verification_token SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_certificates_verification_token
  ON public.certificates(verification_token);

-- Audit hook: log certificate_issued / revoked / reissued
CREATE OR REPLACE FUNCTION public.audit_certificate_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'certificate_issued';
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.revoked IS DISTINCT FROM OLD.revoked AND NEW.revoked = true THEN
      v_action := 'certificate_revoked';
    ELSIF NEW.certificate_url IS DISTINCT FROM OLD.certificate_url
       OR NEW.issued_pdf_path IS DISTINCT FROM OLD.issued_pdf_path THEN
      v_action := 'certificate_reissued';
    ELSE
      RETURN NEW;
    END IF;
  END IF;

  INSERT INTO public.audit_logs (actor_id, action, resource_type, resource_id, metadata)
  VALUES (
    auth.uid(),
    v_action,
    'certificate',
    NEW.id,
    jsonb_build_object(
      'certificate_number', NEW.certificate_number,
      'student_id', NEW.student_id,
      'program_id', NEW.program_id,
      'verification_token', NEW.verification_token
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_certificate_insert ON public.certificates;
CREATE TRIGGER trg_audit_certificate_insert
AFTER INSERT ON public.certificates
FOR EACH ROW EXECUTE FUNCTION public.audit_certificate_changes();

DROP TRIGGER IF EXISTS trg_audit_certificate_update ON public.certificates;
CREATE TRIGGER trg_audit_certificate_update
AFTER UPDATE ON public.certificates
FOR EACH ROW EXECUTE FUNCTION public.audit_certificate_changes();

-- Extend verify_certificate RPC to support lookup by verification_token
CREATE OR REPLACE FUNCTION public.verify_certificate_by_token(_token text)
RETURNS TABLE(certificate_number text, student_name text, program_title text, issued_at timestamptz, revoked boolean, verification_hash text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.certificate_number, p.full_name, pr.title, c.issued_at, c.revoked, c.verification_hash
  FROM public.certificates c
  JOIN public.profiles p ON p.id = c.student_id
  JOIN public.programs pr ON pr.id = c.program_id
  WHERE c.verification_token = _token;
$$;
