ALTER TABLE public.ai_conversations
ADD COLUMN IF NOT EXISTS secondary_contexts jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.ai_conversations.secondary_contexts IS
'Optional array of additional contexts, e.g. [{"type":"community","id":"<uuid>"}]. Passive storage for Phase 7.2 hybrid retrieval.';