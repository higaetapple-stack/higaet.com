# Webhook Failure

## Symptoms
- `api_webhook_deliveries` queue growing
- Subscribers reporting missed events
- Worker logs showing repeated 5xx from subscriber

## Inspect
```sql
SELECT status, count(*) FROM api_webhook_deliveries
WHERE created_at > now() - interval '1 hour' GROUP BY status;

SELECT * FROM api_webhook_deliveries
WHERE status = 'failed' ORDER BY created_at DESC LIMIT 20;
```

## Common causes
- Subscriber endpoint down → exponential backoff via `next_attempt_at` already handles transient failures.
- Signature mismatch → subscriber rotated secret without updating `api_webhook_subscriptions.secret`.
- Worker stalled → `leased_until` rows stuck in the past. Reset:
  ```sql
  UPDATE api_webhook_deliveries SET leased_until = NULL
  WHERE leased_until < now() - interval '5 minutes' AND status IN ('pending','failed');
  ```

## Disable noisy subscriber
```sql
UPDATE api_webhook_subscriptions SET active = false WHERE id = '<id>';
```

## Escalation
If deliveries > 1000 backlog for > 30 min and root cause is internal, treat as SEV2 and follow `incident-response.md`.
