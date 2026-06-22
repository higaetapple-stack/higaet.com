# HIGAET Runbooks

Operational procedures for production incidents and routine maintenance.

| Runbook | Use when |
| --- | --- |
| [incident-response.md](./incident-response.md) | Any outage or degradation — start here |
| [database-restore.md](./database-restore.md) | Data corruption or accidental destructive change |
| [payment-failure.md](./payment-failure.md) | Razorpay failures, missed enrollments |
| [webhook-failure.md](./webhook-failure.md) | Webhook backlog or subscriber errors |
| [rag-worker-failure.md](./rag-worker-failure.md) | Stale embeddings or empty AI retrieval |
| [domain-cutover.md](./domain-cutover.md) | Activating `*.higaet.com` subdomains |
| [security-incident.md](./security-incident.md) | Suspected compromise or vulnerability |

## On-call expectations
- SEV1 acknowledged within 15 min.
- SEV2 within 1 h business / 4 h off-hours.
- All incidents get a postmortem within 5 business days.
