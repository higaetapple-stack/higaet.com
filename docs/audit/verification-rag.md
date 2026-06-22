# Phase 11B Verification — RAG Boundaries

Status: **PASS**

## Tests
1. **Client-supplied collection injection** — caller passes
   `collection_slugs: ["crm","global-education"]` while authenticated only
   as a `student`. `resolveAllowedCollections` ignores client input and
   intersects role allow-list (`ROLE_COLLECTIONS.student`) with mode
   requirements. Rejected slugs logged as `rag.collection_rejected` in
   `domain_events`.
2. **Out-of-scope lesson retrieval** — `faculty` querying with
   `mode = "visa_summary"` produces zero allowed collections; request
   short-circuits with `rag.scope_violation` event; no vector search runs.
3. **Out-of-scope community retrieval** — anonymous mode falls through to
   the public collection allow-list only; `community-private` is filtered
   out before `match_ai_chunks` is called.
4. **DB enforcement** — `match_ai_chunks(collection_ids := allowed_uuids)`
   restricts results at SQL level; even a coding regression in the resolver
   cannot leak chunks from disallowed collections because the parameter is
   server-derived.

## Telemetry
Both event types observed in `domain_events`:
- `rag.scope_violation` — zero allowed collections after intersection.
- `rag.collection_rejected` — client slug stripped during resolution.

## Findings
None.
