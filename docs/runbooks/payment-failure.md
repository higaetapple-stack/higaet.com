# Payment Failure

Applies once Razorpay (Phase 4) is live.

## Symptoms
- Spike in `payments.status = 'failed'`
- Webhook deliveries to `/api/public/webhooks/razorpay` failing
- User reports of unprocessed enrollments

## Triage
1. Check `payments` table: failures concentrated by gateway error code? user? plan?
2. Check `api_webhook_deliveries` for Razorpay events stuck in `failed`.
3. Check Razorpay dashboard for provider-side incidents.

## Mitigations
- Provider outage → display banner on `/checkout`, queue intents in `payments` with `status='pending_retry'`.
- Signature verification failures → confirm `RAZORPAY_WEBHOOK_SECRET` matches dashboard; rotate if leaked.
- Idempotency collisions → ensure `order_id` is unique per attempt; never reuse.

## Reconciliation
1. Pull Razorpay settlement report for the window.
2. Diff against `payments` table.
3. For payments captured at provider but missing locally, replay the webhook (Razorpay dashboard → resend) — handler is idempotent.
4. Refund any duplicate charges via Razorpay dashboard; mirror into `refunds` table.

## Comms
Notify affected users via `notifications` platform (`payment.retry_required` template).
