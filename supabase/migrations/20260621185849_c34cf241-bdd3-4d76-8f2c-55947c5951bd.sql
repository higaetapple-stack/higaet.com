REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_any_role(uuid, app_role[]) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_program_eligible(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.match_ai_chunks(vector, integer, uuid[]) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.prevent_student_grade_tampering() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.tech_proposals_guard_client_update() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_any_role(uuid, app_role[]) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_program_eligible(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.match_ai_chunks(vector, integer, uuid[]) TO authenticated, service_role;