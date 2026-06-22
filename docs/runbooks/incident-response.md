# Incident Response

## Severity matrix
| Sev | Definition | Response time |
| --- | --- | --- |
| SEV1 | Full outage or data exposure | 15 min |
| SEV2 | Major feature unavailable / degraded for >25% users | 1 h |
| SEV3 | Minor degradation, workaround exists | next business day |

## First responder checklist
1. Open an incident channel; assign IC, comms, scribe.
2. Capture initial signal (alert, user report, dashboard).
3. Check `/dashboard/admin/system` and `observability_summary` for elevated `system_errors`, failed notifications, perf p95.
4. Identify last deploy: Lovable publish history + recent migrations.
5. If SEV1, post a holding statement to status channel within 15 min.

## Mitigation paths
- Recent deploy suspected → roll back via Lovable publish history.
- Migration suspected → apply forward-fix migration; never edit prior migrations.
- Third-party (Lovable AI, Supabase, email) → check provider status, switch to backup model/provider if available.

## Post-incident
- Write a postmortem within 5 business days: timeline, impact, root cause, action items.
- File P0/P1 fixes in `docs/audit/critical-fixes.md`.
