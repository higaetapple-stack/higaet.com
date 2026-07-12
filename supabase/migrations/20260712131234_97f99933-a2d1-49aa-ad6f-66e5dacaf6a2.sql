
-- community_members: restrict SELECT to public communities, own membership, members, or admins
DROP POLICY IF EXISTS "Members readable by authenticated" ON public.community_members;
CREATE POLICY "Members visible to community members or public communities"
  ON public.community_members FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'super_admin'::app_role])
    OR EXISTS (
      SELECT 1 FROM public.communities c
      WHERE c.id = community_members.community_id
        AND (c.visibility = 'public' OR public.is_community_member(c.id))
    )
  );

-- threads: restrict SELECT
DROP POLICY IF EXISTS "Threads readable by authenticated" ON public.threads;
CREATE POLICY "Threads visible to community members or public communities"
  ON public.threads FOR SELECT TO authenticated
  USING (
    author_id = auth.uid()
    OR public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'super_admin'::app_role])
    OR EXISTS (
      SELECT 1 FROM public.communities c
      WHERE c.id = threads.community_id
        AND (c.visibility = 'public' OR public.is_community_member(c.id))
    )
  );

-- replies: restrict SELECT via parent thread's community
DROP POLICY IF EXISTS "Replies readable by authenticated" ON public.replies;
CREATE POLICY "Replies visible to community members or public communities"
  ON public.replies FOR SELECT TO authenticated
  USING (
    author_id = auth.uid()
    OR public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'super_admin'::app_role])
    OR EXISTS (
      SELECT 1
      FROM public.threads t
      JOIN public.communities c ON c.id = t.community_id
      WHERE t.id = replies.thread_id
        AND (c.visibility = 'public' OR public.is_community_member(c.id))
    )
  );

-- reactions: restrict SELECT via target (thread or reply -> community)
DROP POLICY IF EXISTS "Reactions readable by authenticated" ON public.reactions;
CREATE POLICY "Reactions visible to community members or public communities"
  ON public.reactions FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'super_admin'::app_role])
    OR (
      target_type = 'thread' AND EXISTS (
        SELECT 1
        FROM public.threads t
        JOIN public.communities c ON c.id = t.community_id
        WHERE t.id = reactions.target_id
          AND (c.visibility = 'public' OR public.is_community_member(c.id))
      )
    )
    OR (
      target_type = 'reply' AND EXISTS (
        SELECT 1
        FROM public.replies r
        JOIN public.threads t ON t.id = r.thread_id
        JOIN public.communities c ON c.id = t.community_id
        WHERE r.id = reactions.target_id
          AND (c.visibility = 'public' OR public.is_community_member(c.id))
      )
    )
  );

-- events: restrict SELECT
DROP POLICY IF EXISTS "Events readable by authenticated" ON public.events;
CREATE POLICY "Events visible to community members or public/global"
  ON public.events FOR SELECT TO authenticated
  USING (
    community_id IS NULL
    OR created_by = auth.uid()
    OR public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'super_admin'::app_role,'faculty'::app_role])
    OR EXISTS (
      SELECT 1 FROM public.communities c
      WHERE c.id = events.community_id
        AND (c.visibility = 'public' OR public.is_community_member(c.id))
    )
  );

-- sso_domains: restrict SELECT to admins only
DROP POLICY IF EXISTS "Authed can view sso domains" ON public.sso_domains;
CREATE POLICY "Admins can view sso domains"
  ON public.sso_domains FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'super_admin'::app_role]));
