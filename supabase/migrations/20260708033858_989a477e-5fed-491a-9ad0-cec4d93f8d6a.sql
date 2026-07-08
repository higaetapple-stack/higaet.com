
-- =========================================================================
-- 1. GRANTS
-- =========================================================================
REVOKE ALL ON public.ai_documents         FROM anon, authenticated;
REVOKE ALL ON public.crm_notes            FROM anon, authenticated;
REVOKE ALL ON public.crm_tasks            FROM anon, authenticated;
REVOKE ALL ON public.crm_follow_ups       FROM anon, authenticated;
REVOKE ALL ON public.sentry_pull_requests FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_documents         TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_notes            TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_tasks            TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_follow_ups       TO authenticated;
GRANT SELECT                         ON public.sentry_pull_requests TO authenticated;

GRANT ALL ON public.ai_documents         TO service_role;
GRANT ALL ON public.crm_notes            TO service_role;
GRANT ALL ON public.crm_tasks            TO service_role;
GRANT ALL ON public.crm_follow_ups       TO service_role;
GRANT ALL ON public.sentry_pull_requests TO service_role;

REVOKE ALL ON public.ai_collections FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_collections TO authenticated;
GRANT ALL ON public.ai_collections TO service_role;

REVOKE ALL ON public.threads FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.threads TO authenticated;
GRANT ALL ON public.threads TO service_role;

REVOKE ALL ON public.employers    FROM anon, authenticated;
REVOKE ALL ON public.job_postings FROM anon, authenticated;

GRANT SELECT                         ON public.employers    TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employers    TO authenticated;
GRANT ALL                            ON public.employers    TO service_role;

GRANT SELECT                         ON public.job_postings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_postings TO authenticated;
GRANT ALL                            ON public.job_postings TO service_role;

-- =========================================================================
-- 2. INDEXES
-- =========================================================================

-- ai_documents
DROP INDEX IF EXISTS public.ai_documents_entity_idx;
CREATE INDEX IF NOT EXISTS ai_documents_collection_idx
  ON public.ai_documents (collection_id);
CREATE INDEX IF NOT EXISTS ai_documents_embedding_status_idx
  ON public.ai_documents (embedding_status)
  WHERE embedding_status <> 'ready';
CREATE INDEX IF NOT EXISTS ai_documents_chunk_status_idx
  ON public.ai_documents (chunk_status)
  WHERE chunk_status <> 'ready';
CREATE INDEX IF NOT EXISTS ai_documents_tags_gin_idx
  ON public.ai_documents USING GIN (tags);
CREATE INDEX IF NOT EXISTS ai_documents_updated_at_idx
  ON public.ai_documents (updated_at DESC);

-- crm
CREATE INDEX IF NOT EXISTS crm_notes_entity_created_idx
  ON public.crm_notes (entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS crm_follow_ups_created_by_idx
  ON public.crm_follow_ups (created_by);
CREATE INDEX IF NOT EXISTS crm_follow_ups_entity_sched_idx
  ON public.crm_follow_ups (entity_type, entity_id, scheduled_at);
CREATE INDEX IF NOT EXISTS crm_tasks_open_due_idx
  ON public.crm_tasks (due_date)
  WHERE completed_at IS NULL;
CREATE INDEX IF NOT EXISTS crm_tasks_created_by_idx
  ON public.crm_tasks (created_by);

-- job_postings
CREATE INDEX IF NOT EXISTS job_postings_skills_gin_idx
  ON public.job_postings USING GIN (skills);
CREATE INDEX IF NOT EXISTS job_postings_employer_status_idx
  ON public.job_postings (employer_id, status);
CREATE INDEX IF NOT EXISTS job_postings_remote_type_idx
  ON public.job_postings (remote_type);
CREATE INDEX IF NOT EXISTS job_postings_experience_level_idx
  ON public.job_postings (experience_level);
CREATE INDEX IF NOT EXISTS job_postings_open_closes_idx
  ON public.job_postings (closes_at)
  WHERE status = 'open';

-- threads
CREATE INDEX IF NOT EXISTS threads_community_feed_idx
  ON public.threads (
    community_id,
    pinned DESC,
    COALESCE(last_reply_at, created_at) DESC
  )
  WHERE deleted_at IS NULL AND is_hidden = false;

-- sentry_pull_requests
CREATE INDEX IF NOT EXISTS sentry_pr_review_queue_idx
  ON public.sentry_pull_requests (requires_human_review)
  WHERE pr_state <> 'merged';
CREATE INDEX IF NOT EXISTS sentry_pr_commit_sha_idx
  ON public.sentry_pull_requests (commit_sha);
CREATE INDEX IF NOT EXISTS sentry_pr_created_by_idx
  ON public.sentry_pull_requests (created_by, created_at DESC);
CREATE INDEX IF NOT EXISTS sentry_pr_labels_gin_idx
  ON public.sentry_pull_requests USING GIN (labels);
