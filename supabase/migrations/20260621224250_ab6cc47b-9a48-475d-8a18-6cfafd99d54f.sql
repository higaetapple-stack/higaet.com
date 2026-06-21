
-- =========================================================
-- Phase 3A: Event + Notification Platform
-- =========================================================

-- Enums
CREATE TYPE public.notification_channel AS ENUM ('in_app', 'email', 'push');
CREATE TYPE public.notification_status  AS ENUM ('pending', 'queued', 'sent', 'delivered', 'failed', 'read');
CREATE TYPE public.notification_priority AS ENUM ('low', 'normal', 'high', 'critical');
CREATE TYPE public.domain_event_status  AS ENUM ('pending', 'processing', 'processed', 'failed');

-- =========================================================
-- 1. domain_events  (event bus log)
-- =========================================================
CREATE TABLE public.domain_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type   text NOT NULL,                    -- e.g. 'enrollment.created'
  aggregate_type text,                            -- e.g. 'enrollment'
  aggregate_id text,                              -- referenced row id (text for flexibility)
  actor_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  payload      jsonb NOT NULL DEFAULT '{}'::jsonb,
  status       public.domain_event_status NOT NULL DEFAULT 'pending',
  error        text,
  processed_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX domain_events_event_type_idx ON public.domain_events(event_type);
CREATE INDEX domain_events_status_idx     ON public.domain_events(status) WHERE status IN ('pending','processing');
CREATE INDEX domain_events_created_at_idx ON public.domain_events(created_at DESC);

GRANT SELECT ON public.domain_events TO authenticated;
GRANT ALL    ON public.domain_events TO service_role;
ALTER TABLE public.domain_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read all domain events" ON public.domain_events
  FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'super_admin'::app_role]));

CREATE TRIGGER domain_events_set_updated_at
  BEFORE UPDATE ON public.domain_events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- 2. notification_templates
-- =========================================================
CREATE TABLE public.notification_templates (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key           text NOT NULL,                            -- e.g. 'enrollment.created'
  channel       public.notification_channel NOT NULL,
  locale        text NOT NULL DEFAULT 'en',
  subject       text,                                     -- email subject / push title
  title         text,                                     -- in-app title
  body_template text NOT NULL,                            -- mustache-style {{var}}
  action_url    text,
  category      text NOT NULL DEFAULT 'system',           -- groups for preferences
  enabled       boolean NOT NULL DEFAULT true,
  metadata      jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (key, channel, locale)
);

GRANT SELECT ON public.notification_templates TO authenticated;
GRANT ALL    ON public.notification_templates TO service_role;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read enabled templates"
  ON public.notification_templates FOR SELECT TO authenticated
  USING (enabled OR public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'super_admin'::app_role]));

CREATE POLICY "Admins manage templates"
  ON public.notification_templates FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'super_admin'::app_role]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'super_admin'::app_role]));

CREATE TRIGGER notification_templates_set_updated_at
  BEFORE UPDATE ON public.notification_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- 3. notifications  (per-user records)
-- =========================================================
CREATE TABLE public.notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id    uuid REFERENCES public.domain_events(id) ON DELETE SET NULL,
  event_type  text NOT NULL,
  category    text NOT NULL DEFAULT 'system',
  title       text NOT NULL,
  body        text NOT NULL,
  action_url  text,
  priority    public.notification_priority NOT NULL DEFAULT 'normal',
  data        jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at     timestamptz,
  archived_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_unread_idx
  ON public.notifications(user_id, created_at DESC)
  WHERE read_at IS NULL AND archived_at IS NULL;
CREATE INDEX notifications_user_recent_idx
  ON public.notifications(user_id, created_at DESC);

GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid()
         OR public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'super_admin'::app_role]));

-- Users can only update read/archived flags on their own rows; trigger enforces field whitelist
CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.notifications_guard_user_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'super_admin'::app_role]) THEN
    RETURN NEW;
  END IF;
  -- preserve everything except read_at / archived_at
  NEW.user_id    := OLD.user_id;
  NEW.event_id   := OLD.event_id;
  NEW.event_type := OLD.event_type;
  NEW.category   := OLD.category;
  NEW.title      := OLD.title;
  NEW.body       := OLD.body;
  NEW.action_url := OLD.action_url;
  NEW.priority   := OLD.priority;
  NEW.data       := OLD.data;
  NEW.created_at := OLD.created_at;
  RETURN NEW;
END $$;

CREATE TRIGGER notifications_guard_user_update_trg
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.notifications_guard_user_update();

CREATE TRIGGER notifications_set_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- =========================================================
-- 4. notification_preferences  (per-user channel opt-ins)
-- =========================================================
CREATE TABLE public.notification_preferences (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category   text NOT NULL,                              -- matches templates.category
  in_app     boolean NOT NULL DEFAULT true,
  email      boolean NOT NULL DEFAULT true,
  push       boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, category)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_preferences TO authenticated;
GRANT ALL ON public.notification_preferences TO service_role;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own preferences"
  ON public.notification_preferences FOR ALL TO authenticated
  USING (user_id = auth.uid()
         OR public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'super_admin'::app_role]))
  WITH CHECK (user_id = auth.uid()
         OR public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'super_admin'::app_role]));

CREATE TRIGGER notification_preferences_set_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- 5. notification_delivery_logs
-- =========================================================
CREATE TABLE public.notification_delivery_logs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid REFERENCES public.notifications(id) ON DELETE CASCADE,
  user_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  channel         public.notification_channel NOT NULL,
  status          public.notification_status NOT NULL DEFAULT 'pending',
  provider        text,                                  -- 'lovable_email', 'web_push', etc.
  provider_message_id text,
  error           text,
  attempts        int NOT NULL DEFAULT 0,
  delivered_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notification_delivery_logs_notif_idx ON public.notification_delivery_logs(notification_id);
CREATE INDEX notification_delivery_logs_user_idx  ON public.notification_delivery_logs(user_id, created_at DESC);

GRANT SELECT ON public.notification_delivery_logs TO authenticated;
GRANT ALL ON public.notification_delivery_logs TO service_role;
ALTER TABLE public.notification_delivery_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own delivery logs"
  ON public.notification_delivery_logs FOR SELECT TO authenticated
  USING (user_id = auth.uid()
         OR public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'super_admin'::app_role]));

CREATE TRIGGER notification_delivery_logs_set_updated_at
  BEFORE UPDATE ON public.notification_delivery_logs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- 6. Helper RPCs
-- =========================================================

-- Unread count for the current user (used by the bell)
CREATE OR REPLACE FUNCTION public.notifications_unread_count()
RETURNS int
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::int
  FROM public.notifications
  WHERE user_id = auth.uid()
    AND read_at IS NULL
    AND archived_at IS NULL;
$$;
GRANT EXECUTE ON FUNCTION public.notifications_unread_count() TO authenticated;

-- Mark all current user's notifications as read
CREATE OR REPLACE FUNCTION public.notifications_mark_all_read()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE n int;
BEGIN
  UPDATE public.notifications
     SET read_at = now()
   WHERE user_id = auth.uid() AND read_at IS NULL;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;
GRANT EXECUTE ON FUNCTION public.notifications_mark_all_read() TO authenticated;

-- Emit a domain event (server-side use; uses service_role usually,
-- but exposed to authenticated for client-emitted events too — RLS-free helper)
CREATE OR REPLACE FUNCTION public.emit_domain_event(
  _event_type text,
  _aggregate_type text DEFAULT NULL,
  _aggregate_id text DEFAULT NULL,
  _payload jsonb DEFAULT '{}'::jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE new_id uuid;
BEGIN
  INSERT INTO public.domain_events(event_type, aggregate_type, aggregate_id, actor_id, payload)
  VALUES (_event_type, _aggregate_type, _aggregate_id, auth.uid(), COALESCE(_payload, '{}'::jsonb))
  RETURNING id INTO new_id;
  RETURN new_id;
END $$;
GRANT EXECUTE ON FUNCTION public.emit_domain_event(text,text,text,jsonb) TO authenticated, service_role;
