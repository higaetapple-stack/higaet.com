# Lovable Cloud Backup & Restore Verification

Last reviewed: 2026-07-08
Owner: Platform / SRE
Scope: Production Lovable Cloud (Postgres) instance backing HIGAET

> HIGAET runs on Lovable Cloud. In user-facing docs and support conversations
> we always call this "Lovable Cloud" or "the backend database". This runbook
> is internal engineering documentation.

## 1. Backup schedule

Lovable Cloud performs automated physical backups of the Postgres instance
on the following schedule:

| Backup type | Frequency | Retention | Trigger              |
| ----------- | --------- | --------- | -------------------- |
| Full snapshot | Daily (00:00 UTC) | 7 days | Managed by Lovable Cloud |
| Point-in-time WAL | Continuous | 7 days (rolling) | Managed by Lovable Cloud |
| Pre-migration snapshot | On every migration apply | 7 days | Cloud migration tool |
| Manual export (JSON/CSV) | On demand | Operator-managed | Cloud → Advanced → Export data |

No customer-managed cron is required; the schedule is enforced by the
managed platform. Instance size upgrades preserve the backup lineage.

## 2. Ownership

- **Primary owner:** Platform / SRE lead
- **Secondary owner:** On-call engineer (rotating, see `docs/runbooks/incident-response.md`)
- **Escalation:** Lovable Cloud support via in-product Help → Contact support
  (reference the project ID from **Backend** panel)

Operators must not fetch or store `SUPABASE_SERVICE_ROLE_KEY` or the database
password — they are not available on Lovable Cloud and are not required for
restore operations documented here.

## 3. Restore procedure (point-in-time)

1. Open **Backend → Advanced settings → Backups** in Lovable.
2. Confirm the target timestamp with the incident commander. Prefer the most
   recent snapshot that predates the corruption.
3. Click **Restore** on the chosen snapshot. Lovable Cloud provisions a fresh
   database from the backup; the previous database is quarantined for
   72 hours in case a re-restore is needed.
4. Once the restore completes:
   - Re-run `supabase--migration` diff to confirm schema parity.
   - Re-run seed / privileged data migrations only if the incident RCA calls
     for it (seed data lives in migrations, not runtime code).
5. Trigger the SRE E2E workflow (`workflow_dispatch` against production) and
   confirm `status=passed` before returning traffic.
6. Force a recheck of the Env Readiness dashboard via
   `POST /api/public/hooks/env-readiness-recheck` with the
   `apikey: <SUPABASE_PUBLISHABLE_KEY>` header and confirm the verdict
   returns to `ready`.

## 4. Full logical export (compliance / off-platform copy)

1. Open **Backend → Advanced settings → Export data** in Lovable.
2. Lovable prepares a signed download; the export excludes the `auth`,
   `storage`, `realtime`, `supabase_functions`, and `vault` schemas.
3. Store the export in the compliance archive bucket (encrypted at rest,
   retention per data-retention policy). Do not commit exports to git.

## 5. Storage bucket backups

Storage buckets in Lovable Cloud are versioned and backed up alongside the
database. To recover a deleted object:

1. **Backend → Storage → <bucket>** → open the object → **Version history**.
2. Restore the desired version, or download it and re-upload with the same
   path.
3. If an entire bucket is lost, open a Lovable Cloud support ticket — the
   platform retains bucket-level snapshots for 7 days.

## 6. Restore drill verification

A restore drill is executed quarterly against staging:

- [ ] 2026-Q3 drill scheduled (owner: Platform SRE)
- [ ] Drill script: create a marker row in `env_readiness_activity`, restore
      staging to a timestamp before the marker, confirm the row is absent.
- [ ] Drill outcome and duration recorded in
      `docs/HIGAET-production-launch-report.md`.

## 7. Related runbooks

- `docs/runbooks/database-restore.md` — step-by-step restore under incident
- `docs/runbooks/incident-response.md` — comms + escalation
- `docs/runbooks/security-incident.md` — restore under suspected compromise
