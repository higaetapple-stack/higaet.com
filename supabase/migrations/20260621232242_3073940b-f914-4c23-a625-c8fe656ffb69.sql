-- =====================================================================
-- Phase 2A: Community Platform (Core + Events + Lesson Discussions)
-- =====================================================================

-- Enums
CREATE TYPE public.community_visibility AS ENUM ('public','private');
CREATE TYPE public.community_membership_type AS ENUM ('open','approval_required');
CREATE TYPE public.community_member_role AS ENUM ('member','moderator','owner');
CREATE TYPE public.reaction_target AS ENUM ('thread','reply');
CREATE TYPE public.event_status AS ENUM ('draft','scheduled','live','completed','cancelled');
CREATE TYPE public.event_rsvp_status AS ENUM ('going','maybe','declined');

-- ---------------------------------------------------------------------
-- communities
-- ---------------------------------------------------------------------
CREATE TABLE public.communities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug citext NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  cover_url text,
  icon_url text,
  visibility public.community_visibility NOT NULL DEFAULT 'public',
  membership_type public.community_membership_type NOT NULL DEFAULT 'open',
  member_count int NOT NULL DEFAULT 0,
  thread_count int NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.communities TO authenticated;
GRANT ALL ON public.communities TO service_role;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Communities readable by authenticated"
  ON public.communities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage communities"
  ON public.communities FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'super_admin'::app_role]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'super_admin'::app_role]));

CREATE TRIGGER trg_communities_updated BEFORE UPDATE ON public.communities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------
-- community_members
-- ---------------------------------------------------------------------
CREATE TABLE public.community_members (
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.community_member_role NOT NULL DEFAULT 'member',
  notify_replies boolean NOT NULL DEFAULT true,
  notify_reactions boolean NOT NULL DEFAULT false,
  notify_events boolean NOT NULL DEFAULT true,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (community_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_members TO authenticated;
GRANT ALL ON public.community_members TO service_role;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members readable by authenticated"
  ON public.community_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users join themselves"
  ON public.community_members FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own membership"
  ON public.community_members FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users leave themselves; admins remove anyone"
  ON public.community_members FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'super_admin'::app_role]));

CREATE INDEX idx_community_members_user ON public.community_members(user_id);

-- Security-definer membership check (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.is_community_member(_community_id uuid, _user_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.community_members
    WHERE community_id = _community_id AND user_id = _user_id
  );
$$;

-- Maintain communities.member_count
CREATE OR REPLACE FUNCTION public.tg_community_members_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.communities SET member_count = member_count + 1 WHERE id = NEW.community_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.communities SET member_count = GREATEST(member_count - 1, 0) WHERE id = OLD.community_id;
  END IF;
  RETURN NULL;
END $$;
CREATE TRIGGER trg_cm_count AFTER INSERT OR DELETE ON public.community_members
  FOR EACH ROW EXECUTE FUNCTION public.tg_community_members_count();

-- ---------------------------------------------------------------------
-- threads (supports lesson discussions via lesson_id)
-- ---------------------------------------------------------------------
CREATE TABLE public.threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id uuid REFERENCES public.lessons(id) ON DELETE SET NULL,
  title text NOT NULL,
  body text NOT NULL,
  pinned boolean NOT NULL DEFAULT false,
  locked boolean NOT NULL DEFAULT false,
  reply_count int NOT NULL DEFAULT 0,
  reaction_count int NOT NULL DEFAULT 0,
  last_reply_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.threads TO authenticated;
GRANT ALL ON public.threads TO service_role;
ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Threads readable by authenticated"
  ON public.threads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Members create threads"
  ON public.threads FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND (public.is_community_member(community_id) OR public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'super_admin'::app_role]))
    AND locked = false AND pinned = false
  );
CREATE POLICY "Authors edit own threads; admins any"
  ON public.threads FOR UPDATE TO authenticated
  USING (author_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'super_admin'::app_role]))
  WITH CHECK (author_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'super_admin'::app_role]));
CREATE POLICY "Authors delete own; admins any"
  ON public.threads FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'super_admin'::app_role]));

CREATE INDEX idx_threads_community_recent ON public.threads(community_id, COALESCE(last_reply_at, created_at) DESC);
CREATE INDEX idx_threads_lesson ON public.threads(lesson_id) WHERE lesson_id IS NOT NULL;
CREATE INDEX idx_threads_author ON public.threads(author_id);

CREATE TRIGGER trg_threads_updated BEFORE UPDATE ON public.threads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Guard non-admins from flipping pinned/locked
CREATE OR REPLACE FUNCTION public.threads_guard_user_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'super_admin'::app_role]) THEN
    RETURN NEW;
  END IF;
  NEW.pinned        := OLD.pinned;
  NEW.locked        := OLD.locked;
  NEW.community_id  := OLD.community_id;
  NEW.author_id     := OLD.author_id;
  NEW.reply_count   := OLD.reply_count;
  NEW.reaction_count:= OLD.reaction_count;
  NEW.last_reply_at := OLD.last_reply_at;
  NEW.created_at    := OLD.created_at;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_threads_guard BEFORE UPDATE ON public.threads
  FOR EACH ROW EXECUTE FUNCTION public.threads_guard_user_update();

-- Bump communities.thread_count
CREATE OR REPLACE FUNCTION public.tg_threads_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.communities SET thread_count = thread_count + 1 WHERE id = NEW.community_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.communities SET thread_count = GREATEST(thread_count - 1, 0) WHERE id = OLD.community_id;
  END IF;
  RETURN NULL;
END $$;
CREATE TRIGGER trg_threads_count AFTER INSERT OR DELETE ON public.threads
  FOR EACH ROW EXECUTE FUNCTION public.tg_threads_count();

-- ---------------------------------------------------------------------
-- replies (single-depth)
-- ---------------------------------------------------------------------
CREATE TABLE public.replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  reaction_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.replies TO authenticated;
GRANT ALL ON public.replies TO service_role;
ALTER TABLE public.replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Replies readable by authenticated"
  ON public.replies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Members reply on unlocked threads"
  ON public.replies FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.threads t
      WHERE t.id = thread_id AND t.locked = false
        AND (public.is_community_member(t.community_id) OR public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'super_admin'::app_role]))
    )
  );
CREATE POLICY "Authors edit own replies; admins any"
  ON public.replies FOR UPDATE TO authenticated
  USING (author_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'super_admin'::app_role]))
  WITH CHECK (author_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'super_admin'::app_role]));
CREATE POLICY "Authors delete own replies; admins any"
  ON public.replies FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'super_admin'::app_role]));

CREATE INDEX idx_replies_thread ON public.replies(thread_id, created_at);
CREATE INDEX idx_replies_author ON public.replies(author_id);

CREATE TRIGGER trg_replies_updated BEFORE UPDATE ON public.replies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Bump threads.reply_count + last_reply_at
CREATE OR REPLACE FUNCTION public.tg_replies_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.threads
       SET reply_count = reply_count + 1, last_reply_at = NEW.created_at
     WHERE id = NEW.thread_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.threads
       SET reply_count = GREATEST(reply_count - 1, 0)
     WHERE id = OLD.thread_id;
  END IF;
  RETURN NULL;
END $$;
CREATE TRIGGER trg_replies_count AFTER INSERT OR DELETE ON public.replies
  FOR EACH ROW EXECUTE FUNCTION public.tg_replies_count();

-- ---------------------------------------------------------------------
-- reactions (polymorphic on thread/reply)
-- ---------------------------------------------------------------------
CREATE TABLE public.reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type public.reaction_target NOT NULL,
  target_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji text NOT NULL CHECK (char_length(emoji) BETWEEN 1 AND 16),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (target_type, target_id, user_id, emoji)
);
GRANT SELECT, INSERT, DELETE ON public.reactions TO authenticated;
GRANT ALL ON public.reactions TO service_role;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reactions readable by authenticated"
  ON public.reactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Members react"
  ON public.reactions FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (
      (target_type = 'thread' AND EXISTS (
        SELECT 1 FROM public.threads t
        WHERE t.id = target_id
          AND (public.is_community_member(t.community_id) OR public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'super_admin'::app_role]))
      ))
      OR (target_type = 'reply' AND EXISTS (
        SELECT 1 FROM public.replies r
        JOIN public.threads t ON t.id = r.thread_id
        WHERE r.id = target_id
          AND (public.is_community_member(t.community_id) OR public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'super_admin'::app_role]))
      ))
    )
  );
CREATE POLICY "Users remove own reactions"
  ON public.reactions FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE INDEX idx_reactions_target ON public.reactions(target_type, target_id);
CREATE INDEX idx_reactions_user ON public.reactions(user_id);

-- Maintain reaction_count on threads/replies
CREATE OR REPLACE FUNCTION public.tg_reactions_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_delta int;
  v_target_type public.reaction_target;
  v_target_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_delta := 1; v_target_type := NEW.target_type; v_target_id := NEW.target_id;
  ELSE
    v_delta := -1; v_target_type := OLD.target_type; v_target_id := OLD.target_id;
  END IF;
  IF v_target_type = 'thread' THEN
    UPDATE public.threads SET reaction_count = GREATEST(reaction_count + v_delta, 0) WHERE id = v_target_id;
  ELSE
    UPDATE public.replies SET reaction_count = GREATEST(reaction_count + v_delta, 0) WHERE id = v_target_id;
  END IF;
  RETURN NULL;
END $$;
CREATE TRIGGER trg_reactions_count AFTER INSERT OR DELETE ON public.reactions
  FOR EACH ROW EXECUTE FUNCTION public.tg_reactions_count();

-- ---------------------------------------------------------------------
-- events
-- ---------------------------------------------------------------------
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid REFERENCES public.communities(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  cover_url text,
  location text,
  virtual_url text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  capacity int,
  rsvp_count int NOT NULL DEFAULT 0,
  status public.event_status NOT NULL DEFAULT 'scheduled',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Events readable by authenticated"
  ON public.events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff manage events"
  ON public.events FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'super_admin'::app_role,'faculty'::app_role]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'super_admin'::app_role,'faculty'::app_role]));

-- Use a trigger (not CHECK) since ends_at must be > starts_at and times can shift
CREATE OR REPLACE FUNCTION public.tg_events_validate()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.ends_at <= NEW.starts_at THEN
    RAISE EXCEPTION 'events.ends_at must be after starts_at';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_events_validate BEFORE INSERT OR UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.tg_events_validate();

CREATE INDEX idx_events_starts ON public.events(starts_at);
CREATE INDEX idx_events_community ON public.events(community_id) WHERE community_id IS NOT NULL;

CREATE TRIGGER trg_events_updated BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------
-- event_rsvps
-- ---------------------------------------------------------------------
CREATE TABLE public.event_rsvps (
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.event_rsvp_status NOT NULL DEFAULT 'going',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_rsvps TO authenticated;
GRANT ALL ON public.event_rsvps TO service_role;
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "RSVPs readable by authenticated"
  ON public.event_rsvps FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users RSVP for themselves"
  ON public.event_rsvps FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own RSVP"
  ON public.event_rsvps FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users cancel own RSVP; staff any"
  ON public.event_rsvps FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'super_admin'::app_role,'faculty'::app_role]));

CREATE INDEX idx_event_rsvps_user ON public.event_rsvps(user_id);

CREATE TRIGGER trg_event_rsvps_updated BEFORE UPDATE ON public.event_rsvps
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Maintain events.rsvp_count (count only 'going')
CREATE OR REPLACE FUNCTION public.tg_event_rsvps_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'going' THEN
      UPDATE public.events SET rsvp_count = rsvp_count + 1 WHERE id = NEW.event_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'going' AND NEW.status <> 'going' THEN
      UPDATE public.events SET rsvp_count = GREATEST(rsvp_count - 1, 0) WHERE id = NEW.event_id;
    ELSIF OLD.status <> 'going' AND NEW.status = 'going' THEN
      UPDATE public.events SET rsvp_count = rsvp_count + 1 WHERE id = NEW.event_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.status = 'going' THEN
      UPDATE public.events SET rsvp_count = GREATEST(rsvp_count - 1, 0) WHERE id = OLD.event_id;
    END IF;
  END IF;
  RETURN NULL;
END $$;
CREATE TRIGGER trg_event_rsvps_count AFTER INSERT OR UPDATE OR DELETE ON public.event_rsvps
  FOR EACH ROW EXECUTE FUNCTION public.tg_event_rsvps_count();

-- ---------------------------------------------------------------------
-- Realtime publication
-- ---------------------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE public.threads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.replies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_rsvps;

-- ---------------------------------------------------------------------
-- Seed: Academy Discussions community (anchors lesson threads)
-- ---------------------------------------------------------------------
INSERT INTO public.communities (slug, name, description, visibility, membership_type)
VALUES ('academy', 'Academy Discussions', 'Discussions across HIGAET Academy programs, courses and lessons.', 'public', 'open')
ON CONFLICT (slug) DO NOTHING;