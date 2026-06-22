# HIGAET — Architecture Audit (Phase 11A)

_Date: 2026-06-22 · Mode: read-only_

## 1. Surface inventory

| Domain | Routes | Server fns | Notes |
|---|---|---|---|
| Academy (programs, courses, lessons, assignments, certificates) | `_authenticated.dashboard.admin.programs.*`, `.assignments`, `.certificates`, `.enrollments` | `academic.functions.ts`, `learn.functions.ts`, `certificates.functions.ts` | Mature |
| Community + Events | `_authenticated.community.*` | `community.functions.ts` | Mature |
| AI Hub (chat, RAG, collections, copilot) | `ai.*`, `_authenticated.assistant.*`, `_authenticated.dashboard.admin.ai.*` | `ai-hub`, `ai-chat`, `ai-tutor`, `ai-copilot`, `ai-knowledge`, `ai-advisor`, `ai-coach` | Wide surface — see AI audit |
| Global Education (study-abroad CRM, counselor, student portal) | `_authenticated.education.*`, `_authenticated.dashboard.counselor.*`, `.admin.sa-*`, `.visa.*` | `education-hub`, `counselor`, `study-abroad`, `crm` | Phase 9A/9B complete |
| API Platform + Webhooks | `_authenticated.dashboard.admin.api`, `.webhooks`, `src/routes/api/v1/*`, `src/routes/api/public/*` | `api-keys.functions.ts`, `api-gateway.server.ts`, `webhook-dispatch.server.ts` | Public surface |
| Identity / MFA / SSO | `_authenticated.dashboard.admin.identity-providers`, auth middleware | `auth.functions.ts` | Mature |
| Observability + Launch | `_authenticated.dashboard.admin.observability`, `.system` | `observability/`, `system-health.functions.ts` | Mature |

35 `*.functions.ts` modules · 7 `*.server.ts` helpers · ~120 route files.

## 2. Boundaries

- **Client → Server:** `createServerFn` everywhere except webhooks/public APIs under `src/routes/api/public/*` and versioned API under `src/routes/api/v1/*`.
- **Auth middleware:** `requireSupabaseAuth` (per-call) + `attachSupabaseAuth` global. ✓
- **Service role:** confined to `*.server.ts` files (`ai-gateway`, `api-gateway`, `webhook-dispatch`, `ai-embeddings`, `tech-pdf`, `config`). ✓ No top-level import in `.functions.ts` modules detected.
- **Public Data API:** scholarships/countries/universities reads use server publishable client — observable in slow-query log (PostgREST format).

## 3. Cross-cutting modules

- **Notifications:** `notifications.functions.ts` + `notification_delivery_logs`. Domain events fan out via DB trigger → `emit_domain_event`.
- **Domain events:** `domain_events` is the spine; triggers on `applications`, `crm_tasks`, `lessons` (embedding enqueue), `event_rsvps`, certificates.
- **RAG pipeline:** `ai_documents` → `ai_embeddings_queue` → `ai_chunks` (pgvector). `match_ai_chunks` RPC for retrieval.
- **Audit:** `audit_logs` (manual + certificate trigger), `security_events`, `system_errors`, `system_metrics`.

## 4. Risks observed

- **Server fn sprawl in `src/lib/`:** 35 modules; several overlap (`ai-chat`, `ai-tutor`, `ai-copilot`, `ai-coach`, `ai-advisor`). Consolidation recommended post-launch (P3).
- **`/api/v1` versioning:** confirmed v1 prefix in place. No v2 yet — fine.
- **No edge-function dependency:** all app logic is `createServerFn` / route handlers — aligned with template guidance. ✓
- **Tenant-shell host isolation:** not yet exercised; pending domain activation (Phase 10C).

## 5. Architectural recommendations

| ID | Item | Priority |
|---|---|---|
| A1 | Consolidate overlapping AI assistant modules (`ai-tutor`/`ai-coach`/`ai-advisor`/`ai-copilot`) into a single typed entry with persona param | P3 |
| A2 | Document the canonical event taxonomy (event_type strings emitted via `emit_domain_event`) | P2 |
| A3 | Add request-ID propagation through `createServerFn` → `system_metrics` for cross-trace stitching | P2 |
| A4 | Move `src/lib/agent`, `kernel`, `governor`, `constitution`, `intent-router`, `memory-graph`, `multi-agent` (experimental agent runtime) behind a feature flag until exercised | P2 |
