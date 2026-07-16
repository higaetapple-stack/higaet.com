# HIGAET Production Launch Report

- **Report date:** 2026-07-08
- **Target deployment date:** 2026-07-08 (rolling)
- **Environment:** Production (`https://higaet.com`) with staging parity at
  `https://staging.higaet.com`
- **Report owner:** Platform / SRE
- **Prepared by:** Production Infrastructure Engineer

## 1. Deployment status

| Area                         | Status      | Evidence                                                                |
| ---------------------------- | ----------- | ----------------------------------------------------------------------- |
| Repository readiness         | GO          | Prior audit — CI, typecheck, security, SRE E2E all PASS                 |
| CI/CD workflows              | PASS        | Least-privilege `permissions:` blocks applied; Node runtime aligned    |
| Security posture             | PASS        | Security scan clean; RLS + GRANTs verified on all public tables         |
| SRE E2E pipeline             | PASS        | HTTP 400 invalid / 500 failed / warning-only pending contracts verified |
| Environment readiness        | READY*      | `/dashboard/admin/env-readiness` verdict must be `ready` at cutover     |
| Supabase backups             | MANAGED     | Daily snapshot + continuous WAL, 7-day retention                        |
| Monitoring (Sentry, Datadog) | ENABLED*    | Requires operator confirmation of production DSN + synthetic monitors   |
| DNS / SSL                    | OPERATOR    | Registrar cutover step, see §8                                          |

`*` — final green tick pending operator action documented below.

## 2. Environment & secret verification

See `docs/production-secret-verification.md`. Cutover checklist:

- [ ] Env Readiness dashboard verdict = `ready`
- [ ] JSON readiness report exported and attached to launch ticket
- [ ] GitHub Actions secret parity confirmed for `production` environment
- [ ] Hardcoded-secret scan clean (`rg` sweep + Gitleaks in CI)
- [ ] Rotation calendar entries created (see §11)

Blocking-secret coverage is enforced in code by
`src/lib/env-readiness.functions.ts` — any missing / malformed required
value flips the launch-readiness banner to **BLOCKED** and blocks the
"Ready for deploy" gate in `/dashboard/admin/launch-readiness`.

## 3. Supabase / Lovable Cloud

- Migrations: all applied, verified with `supabase--migration` diff = empty.
- RLS: enabled on every public table; `has_role` / `has_any_role` used in
  policies to prevent recursion.
- Anonymous access: none granted beyond explicitly public read tables.
- Service role: used only inside `*.server.ts` modules loaded dynamically
  from verified handlers.
- Auth providers configured: email/password, Google, Apple, MFA (TOTP).
- Storage: buckets have explicit RLS; no bucket is `public: true` unless
  documented.
- Backups: see `docs/supabase-backup-restore-verification.md`.

## 4. SRE E2E production run

Execute at cutover (owner: on-call SRE):

1. GitHub Actions → **SRE E2E Smoke** → `workflow_dispatch` → target
   `staging.higaet.com`. Expect `status=passed`, `readyForDeploy=true`.
2. Re-run against `higaet.com`. Expect `status=passed`, `readyForDeploy=true`.
3. Confirm workflow logs contain no unmasked secret values.
4. Verify contract behaviour once per quarter:
   - `pending` → job succeeds with `::warning::` only
   - `failed` → job exits with HTTP 500 non-zero
   - `invalid` → job exits with HTTP 400, no success step runs

Attach the two workflow-run URLs to the launch ticket.

## 5. Monitoring & alerting

| Signal                          | Tool             | Status action                                    |
| ------------------------------- | ---------------- | ------------------------------------------------ |
| Frontend + server errors        | Sentry           | Confirm production DSN active; test alert email  |
| Homepage synthetic              | Datadog          | Enable synthetic check for `https://higaet.com`  |
| `/api/public/sre/e2e-health`    | Datadog / Uptime | 30-second interval, alert on 503 for 2 cycles   |
| SSL expiry                      | Uptime provider  | 30-day advance warning                           |
| GitHub workflow failures        | Slack / email    | `pr-checks`, `sre-e2e`, `launch-readiness`       |
| Repeated SRE `pending` state    | Slack            | Alert if 3 consecutive runs stay pending         |
| Env Readiness `blocked` state   | In-product       | `env_readiness_activity` state-change entries    |

## 6. Staging verification checklist

- [ ] `https://staging.higaet.com` resolves via configured DNS
- [ ] Valid SSL, HTTPS redirect enforced, HSTS header present
- [ ] Nitro node-server boots cleanly (check deployment logs)
- [ ] `GET /api/public/sre/e2e-health` → `200 { healthy: true }`
- [ ] Database connectivity verified via readiness dashboard
- [ ] Google + Apple sign-in flows succeed end-to-end

## 7. Production verification checklist

- [ ] `https://higaet.com` homepage SSR renders (view-source shows content)
- [ ] `<title>` + `<meta name="description">` populated
- [ ] `/sitemap.xml` and `/robots.txt` reachable and correct
- [ ] `GET /api/public/sre/e2e-health` → `200 { healthy: true }`
- [ ] Auth flows: sign-in, sign-out, session refresh
- [ ] Sample database read + write via authenticated dashboard
- [ ] AI Gateway routing responds within SLA (`LOVABLE_API_KEY` live)
- [ ] Storage: signed URL upload + download for authenticated user

## 8. DNS / domain checklist

Registrar operator to confirm:

- [ ] `higaet.com` A record (or CNAME per proxy setup) → Lovable hosting
- [ ] `www.higaet.com` CNAME → apex
- [ ] `staging.higaet.com` CNAME → staging Lovable hosting
- [ ] SSL certificates issued and auto-renewing
- [ ] HSTS enabled with 12-month max-age, `includeSubDomains`
- [ ] SPF record includes Brevo sending IPs
- [ ] DKIM record published for Brevo domain
- [ ] DMARC published at `p=quarantine` (uplift to `p=reject` after 2 weeks)

## 9. Disaster recovery

Runbooks live under `docs/runbooks/`:

- `database-restore.md` — restore procedure (backed by
  `docs/supabase-backup-restore-verification.md`)
- `incident-response.md` — comms tree, sev definitions
- `security-incident.md` — compromise response, credential rotation

Rollback plan (production):

1. Revert the deployed frontend build via Lovable → **Publish → History →
   Restore this version**.
2. If a database migration is implicated, follow point-in-time restore in
   `docs/supabase-backup-restore-verification.md` §3.
3. Force `POST /api/public/hooks/env-readiness-recheck` and confirm verdict
   returns to `ready`.
4. Re-run SRE E2E against production; do not resume traffic until
   `status=passed`.

## 10. Known risks

| Risk                                                      | Severity | Mitigation                                                                  |
| --------------------------------------------------------- | -------- | --------------------------------------------------------------------------- |
| Datadog synthetic keys optional — synthetics off if unset | Low      | Env Readiness marks non-blocking; uptime provider covers homepage as backup |
| Cloudflare R2 keys optional — only needed if R2 enabled   | Low      | Feature-flagged; readiness check reports non-blocking absence               |
| Sentry sourcemap upload depends on CI env `production`    | Low      | Verified `permissions:` block on `sentry-sourcemaps.yml`                   |
| Manual DNS cutover step                                   | Medium   | Operator checklist §8, dual-record staging + production tested first        |

No open Critical or High risks identified in this audit.

## 11. Rotation calendar

| Secret                    | Rotation cadence | Next due    | Owner        |
| ------------------------- | ---------------- | ----------- | ------------ |
| `GITHUB_TOKEN`            | 90 days          | 2026-10-06  | Platform SRE |
| `SRE_E2E_TRIGGER_SECRET`  | 180 days         | 2027-01-04  | Platform SRE |
| `SRE_E2E_BEARER`          | 180 days         | 2027-01-04  | Platform SRE |
| `SESSION_SECRET`          | 365 days         | 2027-07-08  | Platform SRE |
| `SENTRY_AUTH_TOKEN`       | 180 days         | 2027-01-04  | Observability |
| `STRIPE_WEBHOOK_SECRET`   | On endpoint change | n/a       | Payments     |
| `LOVABLE_API_KEY`         | On suspicion / 365 days | 2027-07-08 | Platform SRE |

## 12. Final decision

**Production Status: READY** — pending completion of the operational
checklists in §2, §4, §5, §7, and §8. No repository blockers remain; the
outstanding work is infrastructure verification performed outside the
codebase (registrar, monitoring providers, GitHub Actions secret store,
Lovable Cloud dashboard).

Launch approval requires all checkboxes above to be ticked and the launch
ticket to link:

1. Env Readiness JSON report
2. Two SRE E2E workflow-run URLs (staging + production)
3. Datadog + Sentry dashboard links
4. DNS operator sign-off

Once those artifacts are attached, this project is cleared for production
cutover.
