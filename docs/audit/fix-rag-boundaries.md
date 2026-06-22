# Fix 2 — RAG Collection Allow-List Enforcement (Phase 11B)

_Date: 2026-06-22 · File: `src/lib/ai-copilot.functions.ts`_

## Goal

Close the AI1 finding from the security audit: prevent a caller from steering the Copilot's RAG retrieval to collections their role should not see.

## Threat model

The `askCopilot` server function previously accepted `collections: string[]` from the client and used those slugs (falling back to all five collections) when invoking `match_ai_chunks`. Although the function gated by staff role, a low-privilege staff role (e.g. `faculty`) could request `crm` or `technologies` collections and the server would happily retrieve and synthesize from them.

## Enforcement

Two-layer derivation, **server-side only**:

1. **Role → collections (allow-list).**
   - `super_admin`, `admin` → all five collections
   - `counselor` → `global-education`, `crm`, `academy`
   - `placement_officer` → `career`, `crm`, `academy`
   - `faculty` → `academy`
   - `technology_consultant` → `technologies`, `crm`
2. **Mode → collections (narrowing scope).** When the copilot mode implies a specific surface (`student_summary` → academy+career, `visa_summary` → global-education, `lead_summary` → crm, etc.), intersect with the role allow-list. Modes without a scope (`overview`, draft modes) use the full role allow-list.

The final set is what gets passed to `match_ai_chunks`. The client-supplied `collections` field is **read for telemetry only** — never used to widen scope.

## Observability

- `rag.scope_violation` — emitted to `domain_events` whenever a request contained collections that the resolved allow-list does not permit. Payload: `{ requested, allowed, rejected, mode }`.
- `rag.collection_rejected` — emitted when the resolved allow-list is empty (role/mode combination has no permitted collections). Payload: `{ reason, roles, mode }`. Retrieval is skipped; the model answers from the structured record only.

Both events are queryable via the existing admin domain-events view.

## Related surfaces — already safe

| Caller | Scope source | Verdict |
|---|---|---|
| `ai-tutor.functions.ts` | hardcoded `academy` slug | safe |
| `ai-coach.functions.ts` | hardcoded `career` slug | safe |
| `ai-advisor.functions.ts` | hardcoded `global-education` slug | safe |
| `ai-knowledge.functions.ts` `searchKnowledge` | admin-only via `assertAdmin` | safe |
| `ai-knowledge.functions.ts` `runAgent` | `agent.collection_ids` from `ai_agent_configs` (admin-managed) | safe |
| `src/routes/api/chat.ts` | derived from lesson/thread sibling lookup; no `collection_ids` param | safe |

## Validation

```text
✓ Faculty user requesting collections=["crm"] → rejected, rag.scope_violation emitted, retrieval scoped to ["academy"]
✓ Admin user (no collections param) → all five collections used
✓ Counselor in visa_summary mode → retrieval scoped to ["global-education"] (intersection)
✓ Role with no allowed collections (none in practice) → rag.collection_rejected emitted, retrieval skipped, structured-only answer
```

## Follow-ups

- P3: same hardening pattern should be applied if/when `ai-copilot` adds an external/partner caller surface.
- P3: surface scope-violation count on `/dashboard/admin/system` as a security signal.
