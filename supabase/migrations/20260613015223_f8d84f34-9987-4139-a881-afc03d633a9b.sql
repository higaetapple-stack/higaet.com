
-- has_role / has_any_role: needed inside RLS policies, so authenticated users must keep EXECUTE.
-- Revoke from anon and public.
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_any_role(UUID, public.app_role[]) FROM PUBLIC, anon;

-- handle_new_user: trigger-only. Nobody should call it directly.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- set_updated_at: trigger-only.
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
