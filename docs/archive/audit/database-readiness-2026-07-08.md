# HIGAET Database Readiness Audit — 2026-07-08

Scope: `ai_collections`, `ai_documents`, `crm_follow_ups`, `crm_notes`, `crm_tasks`,
`employers`, `job_postings`, `threads`, `sentry_pull_requests`.
Environment: Lovable Cloud (Supabase) — production project.

---

## 1. Schema verification

| Table | Exists | Cols | PK | `created_at` / `updated_at` |
|---|---|---|---|---|
| ai_collections | ✅ | 7 | id (uuid) | ✅ / ✅ |
| ai_documents | ✅ | 13 | id (uuid) | ✅ / ✅ |
| crm_follow_ups | ✅ | 10 | id (uuid) | ✅ / ✅ |
| crm_notes | ✅ | 7 | id (uuid) | ✅ / ✅ |
| crm_tasks | ✅ | 11 | id (uuid) | ✅ / ✅ |
| employers | ✅ | 13 | id (uuid) | ✅ / ✅ |
| job_postings | ✅ | 21 | id (uuid) | ✅ / ✅ |
| threads | ✅ | 15 | id (uuid) | ✅ / ✅ |
| sentry_pull_requests | ✅ | 23 | id (uuid) | ✅ / ✅ |

### Foreign keys (all with `ON DELETE` semantics — good)
- `ai_documents.collection_id → ai_collections(id)` SET NULL
- `ai_documents.source_id → knowledge_sources(id)` SET NULL
- `crm_notes.author_id`, `crm_follow_ups.created_by`, `crm_tasks.assigned_to`, `crm_tasks.created_by` → `profiles(id)` SET NULL
- `employers.created_by → profiles(id)` SET NULL
- `job_postings.employer_id → employers(id)` CASCADE; `job_postings.created_by → profiles(id)` SET NULL
- `threads.community_id → communities(id)` CASCADE; `threads.author_id → auth.users(id)` CASCADE; `threads.lesson_id → lessons(id)` SET NULL

### Unique constraints / notable columns
- `ai_collections.slug`, `employers.slug`, `job_postings.slug` unique — good.
- `ai_documents (entity_type, entity_id)` has BOTH a plain and a UNIQUE index — the plain btree is redundant.
- `sentry_pull_requests (repo, branch_name)` unique; `(issue_id, analysis_hash)` unique.
- `job_postings` uses enum types (`job_status`, `job_remote_type`, `job_employment_type`, `job_experience_level`).

### Nullability observations (informational, not blocking)
- `ai_documents.entity_type` / `entity_id` are nullable but participate in a UNIQUE index — nulls are allowed to repeat, which is intentional if only some docs are entity-linked.
- CRM `created_by` / `author_id` are nullable so `ON DELETE SET NULL` works; acceptable.

**Verdict: schema is production-ready.**

---

## 2. RLS & policy audit

RLS is **ENABLED** on all 9 tables. ✅

| Table | anon | authenticated | Admin write path |
|---|---|---|---|
| ai_collections | ❌ | SELECT where `is_active=true` | `admin` (ALL) |
| ai_documents | ❌ | admin/super_admin (ALL) | ✅ |
| crm_follow_ups | ❌ | admin/super_admin/counselor/placement_officer (ALL) | ✅ |
| crm_notes | ❌ | same as above | ✅ |
| crm_tasks | ❌ | same as above | ✅ |
| employers | SELECT (public directory) | admin/super_admin/placement_officer (ALL) | ✅ |
| job_postings | SELECT where `status='open'` | admin/super_admin/placement_officer (ALL) | ✅ |
| threads | ❌ | SELECT all authed; INSERT community members; UPDATE/DELETE author or admin | ✅ |
| sentry_pull_requests | ❌ | admin/super_admin (SELECT only) | ✅ writes via service_role |

**Anon exposure:** limited to `employers.*` (public directory, expected) and
`job_postings` where `status='open'` (expected). No PII paths are reachable to `anon`.

**Admin roles:** every write policy uses `has_role`/`has_any_role`
security-definer helpers — no recursion risk, matches project convention.

**Verdict: policy model is correct.** One caveat below in §3.

---

## 3. Grants audit — ⚠️ finding (medium)

Every table currently grants the full set
`SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN`
to both `anon` and `authenticated`. RLS blocks DML at row level, but:

- **TRUNCATE bypasses RLS.** Any role with TRUNCATE can wipe the table. PostgREST
  does not expose TRUNCATE today, but this is a defence-in-depth gap.
- `REFERENCES`, `TRIGGER`, `MAINTAIN` are not needed by API roles.
- `anon` should have `INSERT/UPDATE/DELETE` only where a policy allows it —
  currently it has them on staff-only tables (CRM, ai_documents, sentry_pull_requests, threads)
  purely because of an over-broad grant. RLS is the only thing standing in the way.

The remediation migration below revokes the excess and re-grants the minimum
required per policy.

---

## 4. Index recommendations

Current indexes cover PKs, slugs, and the hottest filters. Gaps below are ordered by expected impact.

### AI search (`ai_documents`)
- `(collection_id)` — collection-scoped listings and RAG filters.
- `(embedding_status)` and `(chunk_status)` — worker queues poll on these.
- `USING GIN (tags)` — tag filters in RAG.
- `(updated_at DESC)` — recency in admin surfaces.
- Drop the redundant plain btree `ai_documents_entity_idx` (unique index covers it).

### CRM queries
- `crm_notes (entity_type, entity_id, created_at DESC)` — entity timeline reads.
- `crm_follow_ups (created_by)` and `(entity_type, entity_id, scheduled_at)` — staff dashboards.
- `crm_tasks (due_date) WHERE completed_at IS NULL` — "my open tasks by due date".
- `crm_tasks (created_by)` — CRM ownership filters.

### Job filtering
- `job_postings USING GIN (skills)` — skill filter is the most common facet.
- `job_postings (employer_id, status)` — employer detail page.
- `job_postings (remote_type, experience_level, employment_type)` filter combos: at minimum add `(remote_type)` and `(experience_level)`; low cardinality but scans a large `status_idx`.
- `job_postings (closes_at) WHERE status='open'` — expiry sweeps.

### Community sorting (`threads`)
- `threads (community_id, pinned DESC, COALESCE(last_reply_at, created_at) DESC) WHERE deleted_at IS NULL AND is_hidden = false` — matches the actual list query with pinned-first.
- `threads USING GIN (tags)` — tag filtering.

### SRE lookup (`sentry_pull_requests`)
- `(requires_human_review) WHERE pr_state <> 'merged'` — review queue.
- `(commit_sha)` — deploy correlation.
- `(created_by, created_at DESC)` — actor timelines.

Existing `state_idx (pr_state, created_at DESC)` and `issue_idx` cover the main dashboards.

---

## 5. TypeScript types

`src/integrations/supabase/types.ts` is auto-generated and gets refreshed on
every applied migration. After the remediation migration below runs, the file
is regenerated automatically — no manual step needed. No schema mutations are
proposed (only grants + indexes), so the generated `Database` type is unchanged
by this audit.

---

## 6. Required remediation

Only one migration is required: revoke excess grants (security) and add the
recommended indexes (performance). No table/column/constraint changes.
See `supabase/migrations/…_db_readiness_hardening.sql` (submitted for approval).
