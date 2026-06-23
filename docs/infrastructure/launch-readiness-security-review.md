# Launch Readiness — Security Review

_Date: 2026-06-23 · Scope: Phase 6 production verification_

## 1. Ingest endpoint (`POST /api/public/launch-readiness/ingest`)

| Control | Status | Notes |
| --- | --- | --- |
| HMAC-SHA256 signature required | ✅ | `x-signature` header compared with `timingSafeEqual` against `crypto.createHmac("sha256", LAUNCH_READINESS_INGEST_SECRET)` over the raw body. |
| Secret stored server-side only | ✅ | `LAUNCH_READINESS_INGEST_SECRET` lives in Lovable Cloud secrets — never read in client bundles (process.env only inside route handler). |
| Disabled when secret missing | ✅ | Returns `503 Ingest disabled` instead of falling open. |
| Raw body read before parse | ✅ | Signature computed on bytes, then JSON parsed. Prevents canonicalization mismatch. |
| Constant-time compare | ✅ | `timingSafeEqual` with length pre-check. |
| Input validation | ✅ | Rejects missing `commit_sha` / `branch` / `environment` with 400. Numeric fields default to 0; JSON fields default to `{}`. |
| Service-role import scope | ✅ | `supabaseAdmin` is imported **inside** the handler via `await import(...)`, never at module scope, so it cannot leak to client bundles. |
| Response surface | ✅ | Returns only `{ ok, id }` — no row data echoed back to caller. |

**Residual risk**: low. The endpoint accepts arbitrary payloads from anyone holding the HMAC secret. Rotate `LAUNCH_READINESS_INGEST_SECRET` if a CI runner is ever compromised.

## 2. Admin dashboard (`/dashboard/admin/launch-readiness`)

| Control | Status |
| --- | --- |
| Route lives under `_authenticated/` subtree (integration-managed gate) | ✅ |
| Server fns gate on `has_role(admin) OR has_role(super_admin)` | ✅ — `assertAdmin()` in `launch-readiness.functions.ts` |
| All fns use `requireSupabaseAuth` middleware | ✅ |
| RLS double-defense (table policy admin-only) | ✅ — `Admins read launch readiness runs` |
| No client bundling of service-role client | ✅ — only `auth-middleware` + supabase user client are imported |

## 3. `launch_readiness_runs` table

| Control | Status |
| --- | --- |
| RLS enabled | ✅ |
| SELECT: admins + super_admins only | ✅ |
| INSERT/UPDATE/DELETE: `service_role` only | ✅ |
| `anon` GRANT absent | ✅ |
| Indexes on `created_at DESC`, `branch`, `environment`, `overall_status` | ✅ |
| No PII columns | ✅ — stores commit metadata + counts only |

## 4. Notification fan-out (`scripts/notify-failure.mjs`)

| Control | Status |
| --- | --- |
| No secrets in payload bodies | ✅ — payload contains run metadata + public artifact URLs only |
| Webhook URLs read from env, never hardcoded | ✅ |
| Missing webhook env → silent skip (not failure) | ✅ |
| Per-channel failures are isolated | ✅ — errors collected per channel; process exits non-zero only if any send failed |
| Structured JSON log on stdout for CI capture | ✅ |
| No `console.log` of secrets | ✅ — only payload (no secret material) is serialized |

## 5. Workflow (`launch-readiness.yml`)

| Control | Status |
| --- | --- |
| `LAUNCH_READINESS_INGEST_SECRET` only passed to ingest step | ✅ — workflow-level `env:` exposes webhook URLs only; ingest secret scoped to step |
| HMAC computed with `openssl dgst -sha256 -hmac` over exact JSON payload | ✅ |
| `if: always()` upload guarded with 30-day retention | ✅ |
| Failure notifications scoped to `if: failure()` | ✅ |
| Schema-validation artifact uploaded regardless of pass/fail | ✅ |

## 6. Logging hygiene

- Ingest handler writes no payload contents to stdout — only success/error rows go to the DB.
- Dashboard emits a `console.debug` access marker **only when `import.meta.env.DEV`** is true. No production logs.
- `notify-failure.mjs` writes a structured JSON line (`{notify:[...]}`) — channel names + send/skip/error only; webhook URLs never logged.

## 7. Findings & remediation

No critical or high findings. No remediation required this pass.

**Hardening backlog (non-blocking)**:
1. Add monotonic nonce or replay-window check (`X-Ingest-Timestamp` + max-skew) to the ingest endpoint if CI logs ever become public.
2. Add per-IP rate limit on the ingest route via existing `@/lib/server/rate-limit` once we observe baseline traffic.
3. Periodic rotation of `LAUNCH_READINESS_INGEST_SECRET` (annual).

## 8. Sign-off

Security posture for the Launch Readiness system is **production-ready**.
