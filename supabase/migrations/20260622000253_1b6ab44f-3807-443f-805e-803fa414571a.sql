
ALTER TABLE public.threads
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false;

ALTER TABLE public.replies
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS threads_visible_idx ON public.threads (community_id) WHERE deleted_at IS NULL AND is_hidden = false;
CREATE INDEX IF NOT EXISTS replies_visible_idx ON public.replies (thread_id) WHERE deleted_at IS NULL AND is_hidden = false;
