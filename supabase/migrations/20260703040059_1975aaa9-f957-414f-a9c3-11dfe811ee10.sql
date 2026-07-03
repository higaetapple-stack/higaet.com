
-- =====================================================================
-- Security hardening migration
-- Fixes three privilege-escalation findings without changing schema
-- or breaking existing app flows.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) counselor_assignments: prevent self-assignment by counselors
-- ---------------------------------------------------------------------
-- Prior policy allowed any counselor/placement_officer to INSERT/UPDATE/DELETE
-- rows, letting a counselor assign themselves to any student and then bypass
-- profile access restrictions. We split the single ALL policy into:
--   * SELECT: admins see all; counselors see only rows they are assigned to.
--   * INSERT/UPDATE/DELETE: admins/super_admins only. Service role bypasses
--     RLS and continues to work from trusted backend code.

DROP POLICY IF EXISTS "counselor_assignments staff manage" ON public.counselor_assignments;

CREATE POLICY "counselor_assignments admin write"
  ON public.counselor_assignments
  FOR ALL
  TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'super_admin'::app_role]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'super_admin'::app_role]));

CREATE POLICY "counselor_assignments read own"
  ON public.counselor_assignments
  FOR SELECT
  TO authenticated
  USING (
    counselor_id = auth.uid()
    OR public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'super_admin'::app_role])
  );

-- ---------------------------------------------------------------------
-- 2) community_members: block role escalation on self-update
-- ---------------------------------------------------------------------
-- Users could UPDATE their own row and set role='owner'/'moderator'. We keep
-- the "user can update own row" policy (so notification prefs still work),
-- and add a BEFORE UPDATE trigger that pins privileged columns to OLD values
-- unless the caller is an admin/super_admin or an existing owner/moderator
-- of that community. INSERT already sets role via default; we also pin role
-- on INSERT for non-admin self-joins so users can't ship role in the payload.

CREATE OR REPLACE FUNCTION public.community_members_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin boolean;
  is_privileged_member boolean;
BEGIN
  is_admin := public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'super_admin'::app_role]);

  IF TG_OP = 'INSERT' THEN
    IF is_admin THEN
      RETURN NEW;
    END IF;
    -- Non-admins joining themselves cannot pick an elevated role.
    IF NEW.role IS DISTINCT FROM 'member'::public.community_role THEN
      NEW.role := 'member'::public.community_role;
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE branch
  IF is_admin THEN
    RETURN NEW;
  END IF;

  -- Owners/moderators of the SAME community may change other members' roles,
  -- but not their own row's role (prevents self-promotion loops).
  SELECT EXISTS (
    SELECT 1 FROM public.community_members m
    WHERE m.community_id = OLD.community_id
      AND m.user_id = auth.uid()
      AND m.role IN ('owner'::public.community_role, 'moderator'::public.community_role)
  ) INTO is_privileged_member;

  -- Always pin identity/community — nobody moves rows across users/communities.
  NEW.user_id      := OLD.user_id;
  NEW.community_id := OLD.community_id;
  NEW.joined_at    := OLD.joined_at;

  IF is_privileged_member AND OLD.user_id <> auth.uid() THEN
    -- privileged member editing someone else: allow role change
    RETURN NEW;
  END IF;

  -- Everyone else: cannot change role.
  NEW.role := OLD.role;
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS community_members_guard_ins ON public.community_members;
DROP TRIGGER IF EXISTS community_members_guard_upd ON public.community_members;

CREATE TRIGGER community_members_guard_ins
  BEFORE INSERT ON public.community_members
  FOR EACH ROW EXECUTE FUNCTION public.community_members_guard();

CREATE TRIGGER community_members_guard_upd
  BEFORE UPDATE ON public.community_members
  FOR EACH ROW EXECUTE FUNCTION public.community_members_guard();

-- ---------------------------------------------------------------------
-- 3) realtime.messages: gate private community topics by membership
-- ---------------------------------------------------------------------
-- Prior policy allowed any authenticated user to subscribe to `thread:*`
-- and `lesson-threads:*`, leaking private community broadcasts. We add a
-- SECURITY DEFINER helper that maps a topic to its community and enforces:
--   * public community  -> anyone authenticated
--   * private community -> members only (reuses public.is_community_member)
-- Notifications, user channels, and global channels are unchanged.

CREATE OR REPLACE FUNCTION public.can_subscribe_realtime_topic(_topic text, _user uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_community uuid;
  v_visibility public.community_visibility;
BEGIN
  IF _user IS NULL THEN
    RETURN false;
  END IF;

  -- User-scoped channels: only the owning user
  IF _topic LIKE 'notifications:%' OR _topic LIKE 'user:%' THEN
    RETURN split_part(_topic, ':', 2) = _user::text;
  END IF;

  -- Global broadcast channels
  IF _topic IN ('events','announcements','system') THEN
    RETURN true;
  END IF;

  -- Community-thread channels
  IF _topic LIKE 'thread:%' THEN
    BEGIN
      v_id := split_part(_topic, ':', 2)::uuid;
    EXCEPTION WHEN others THEN
      RETURN false;
    END;
    SELECT t.community_id INTO v_community
    FROM public.threads t WHERE t.id = v_id;
    IF v_community IS NULL THEN
      RETURN false;
    END IF;
    SELECT c.visibility INTO v_visibility
    FROM public.communities c WHERE c.id = v_community;
    IF v_visibility = 'public'::public.community_visibility THEN
      RETURN true;
    END IF;
    RETURN public.is_community_member(v_community, _user);
  END IF;

  -- Lesson thread channels: gate by the community owning the lesson's thread
  IF _topic LIKE 'lesson-threads:%' THEN
    BEGIN
      v_id := split_part(_topic, ':', 2)::uuid;
    EXCEPTION WHEN others THEN
      RETURN false;
    END;
    -- If no thread exists yet for the lesson, allow authenticated users
    -- (nothing to leak) so lesson pages can subscribe before the first post.
    IF NOT EXISTS (SELECT 1 FROM public.threads t WHERE t.lesson_id = v_id) THEN
      RETURN true;
    END IF;
    -- If ANY hosting community is public, allow; else require membership in
    -- at least one hosting community.
    IF EXISTS (
      SELECT 1 FROM public.threads t
      JOIN public.communities c ON c.id = t.community_id
      WHERE t.lesson_id = v_id AND c.visibility = 'public'::public.community_visibility
    ) THEN
      RETURN true;
    END IF;
    RETURN EXISTS (
      SELECT 1 FROM public.threads t
      WHERE t.lesson_id = v_id
        AND public.is_community_member(t.community_id, _user)
    );
  END IF;

  RETURN false;
END
$$;

GRANT EXECUTE ON FUNCTION public.can_subscribe_realtime_topic(text, uuid) TO authenticated;

DROP POLICY IF EXISTS "authenticated_can_receive_own_or_public" ON realtime.messages;

CREATE POLICY "authenticated_can_receive_scoped"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (public.can_subscribe_realtime_topic(topic, auth.uid()));
