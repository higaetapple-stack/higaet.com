# Database Restore

Lovable Cloud manages Supabase backups. Service-role keys and the database password are **not** exposed to the project; restore is performed via Lovable support.

## When to restore
- Destructive migration applied to production
- Bulk data corruption (bad import, runaway script)
- Ransomware / compromised service-role key

## Procedure
1. Freeze writes: revoke the offending API key(s); set affected app surface to read-only via feature flag if available.
2. Capture forensic snapshot: export affected tables to CSV via `psql -c "COPY ... TO STDOUT WITH CSV HEADER"` and store under `/mnt/documents/incident-<id>/`.
3. Contact Lovable support with:
   - project ID
   - target restore timestamp (UTC)
   - tables in scope (full restore vs partial)
4. After restore, run verification queries:
   - row counts on critical tables (`profiles`, `applications`, `enrollments`, `payments`)
   - last `created_at` per table
   - smoke test sign-in + one read-write path
5. Re-enable writes; emit `system.restore_completed` domain event.

## Test cadence
Quarterly: request a point-in-time restore into a scratch project, verify checksums.
