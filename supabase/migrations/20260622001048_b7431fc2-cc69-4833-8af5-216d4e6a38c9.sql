
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TYPE public.ai_context_type AS ENUM ('lesson', 'community', 'general');
CREATE TYPE public.ai_message_role AS ENUM ('user', 'assistant', 'system');

CREATE TABLE public.ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  context_type public.ai_context_type NOT NULL DEFAULT 'general',
  context_id uuid,
  title text NOT NULL DEFAULT 'New conversation',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ai_conversations_user_idx ON public.ai_conversations (user_id, updated_at DESC);
CREATE INDEX ai_conversations_context_idx ON public.ai_conversations (context_type, context_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_conversations TO authenticated;
GRANT ALL ON public.ai_conversations TO service_role;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_conv_select" ON public.ai_conversations FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "ai_conv_insert" ON public.ai_conversations FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "ai_conv_update" ON public.ai_conversations FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "ai_conv_delete" ON public.ai_conversations FOR DELETE TO authenticated
  USING (user_id = auth.uid());
CREATE TRIGGER ai_conversations_set_updated_at BEFORE UPDATE ON public.ai_conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role public.ai_message_role NOT NULL,
  content text NOT NULL,
  token_count integer,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ai_messages_conv_idx ON public.ai_messages (conversation_id, created_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_messages TO authenticated;
GRANT ALL ON public.ai_messages TO service_role;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_msg_select" ON public.ai_messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.ai_conversations c WHERE c.id = ai_messages.conversation_id
    AND (c.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));
CREATE POLICY "ai_msg_insert" ON public.ai_messages FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.ai_conversations c WHERE c.id = ai_messages.conversation_id
    AND c.user_id = auth.uid()));
CREATE POLICY "ai_msg_delete" ON public.ai_messages FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.ai_conversations c WHERE c.id = ai_messages.conversation_id
    AND c.user_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.touch_ai_conversation()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  UPDATE public.ai_conversations SET updated_at = now() WHERE id = NEW.conversation_id;
  RETURN NEW;
END $$;
CREATE TRIGGER ai_messages_touch_parent AFTER INSERT ON public.ai_messages
  FOR EACH ROW EXECUTE FUNCTION public.touch_ai_conversation();
