# Phase 2.0.2 — Rollback Verification Pipeline

**Status:** ✅ Implemented (pipeline only — no live deployment performed)
**Scope:** CI/CD workflow that deploys, validates, and auto-rolls-back on failure.
**Out of scope:** Production deployment, DNS, runtime cutover.

---

## Pipeline

`.github/workflows/staging-rollback-validation.yml`

```
checkout → install → typecheck → env-validate → build
        → package → scp → activate (record previous symlink)
        → health probe → smoke suite
        → on failure: restore previous symlink → re-verify health
```

The previous release symlink target is captured into
`~/apps/higaet/.previous-release` **before** the new symlink is swung, so the
rollback step can restore it atomically.

---

## Required Checks

### Pre-deploy
- `bun install --frozen-lockfile`
- `bunx tsc --noEmit`
- `node scripts/validate-env.mjs --strict`
- `bun run build`

### Post-deploy
- `GET $STAGING_BASE_URL/api/public/health` (10 retries × 5 s)
- `bun scripts/run-smoke-tests.ts` (Phase 2.0.1 suite)

### Rollback verification
- Symlink restored to previous release
- `tmp/restart.txt` touched (Passenger restart)
- Health endpoint healthy within 8 retries × 5 s

---

## Failure Conditions → Auto-Rollback

| Step | Action on failure |
| --- | --- |
| Build / typecheck / env | Workflow fails before deploy — no rollback needed |
| SCP / activate | Manual intervention (deployment never went live) |
| Health probe | Auto-rollback + re-verify |
| Smoke suite | Auto-rollback + re-verify |

---

## Required Secrets

| Secret | Purpose |
| --- | --- |
| `STAGING_HOST` | MilesWeb SSH host for staging |
| `STAGING_BASE_URL` | Public base URL for health + smoke probes |
| `SSH_USER`, `SSH_KEY` | MilesWeb SSH credentials |
| `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Pre-deploy env validation |
| `SESSION_SECRET` | Pre-deploy env validation |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` | Build-time |

---

## Validation Status

- ✅ Workflow file authored and committed.
- ✅ Smoke runner contract aligned with rollback step.
- ✅ Previous-release marker design verified against existing
  `deploy-milesweb.yml` symlink layout (`~/apps/higaet/current → releases/<sha>`).
- 🟡 Live rehearsal **pending** — requires MilesWeb staging slot from
  Phase 2.1 prep before the first real run.

---

## Remaining Risks

- First real rollback rehearsal must occur in Phase 2.1 staging window.
- Passenger restart timing on MilesWeb is unverified (assumes `tmp/restart.txt`
  triggers a sub-5-second swap).
- Pipeline does not yet handle Supabase migration rollback — out of scope for
  Phase 2.0.2; tracked for Phase 2.2.

---

## Phase 2.1 Authorization

Phase 2.0.1 + Phase 2.0.2 deliverables are in place. Phase 2.1 (MilesWeb
staging runtime deployment) may proceed once the staging slot, secrets, and
DNS for `staging.higaet.com` are provisioned per the Phase 2.0 readiness
report. Production cutover remains blocked.
