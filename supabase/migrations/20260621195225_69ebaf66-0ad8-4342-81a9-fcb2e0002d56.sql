
-- 1. Tighten ai_conversation_logs INSERT policy: remove admin OR branch
DROP POLICY IF EXISTS "Users insert own conversation logs" ON public.ai_conversation_logs;
CREATE POLICY "Users insert own conversation logs"
  ON public.ai_conversation_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 2. Bind trigger functions to their tables (no triggers currently exist)

-- profiles: assign portfolio slug + updated_at
DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS profiles_assign_portfolio_slug ON public.profiles;
CREATE TRIGGER profiles_assign_portfolio_slug
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_assign_portfolio_slug();

-- auth.users -> handle_new_user (create profile + assign student role)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- submissions: prevent student grade tampering
DROP TRIGGER IF EXISTS submissions_prevent_grade_tampering ON public.submissions;
CREATE TRIGGER submissions_prevent_grade_tampering
  BEFORE UPDATE ON public.submissions
  FOR EACH ROW EXECUTE FUNCTION public.prevent_student_grade_tampering();

-- tech_proposals: guard client-side updates
DROP TRIGGER IF EXISTS tech_proposals_guard_client_update ON public.tech_proposals;
CREATE TRIGGER tech_proposals_guard_client_update
  BEFORE UPDATE ON public.tech_proposals
  FOR EACH ROW EXECUTE FUNCTION public.tech_proposals_guard_client_update();

-- updated_at on common tables that have the column
DROP TRIGGER IF EXISTS programs_set_updated_at ON public.programs;
CREATE TRIGGER programs_set_updated_at BEFORE UPDATE ON public.programs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS courses_set_updated_at ON public.courses;
CREATE TRIGGER courses_set_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS lessons_set_updated_at ON public.lessons;
CREATE TRIGGER lessons_set_updated_at BEFORE UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS submissions_set_updated_at ON public.submissions;
CREATE TRIGGER submissions_set_updated_at BEFORE UPDATE ON public.submissions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS tech_proposals_set_updated_at ON public.tech_proposals;
CREATE TRIGGER tech_proposals_set_updated_at BEFORE UPDATE ON public.tech_proposals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
