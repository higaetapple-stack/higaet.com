# HIGAET Transactional Email — Brevo HTTP API

## Architecture

- Provider: **Brevo HTTP API** (`https://api.brevo.com/v3/smtp/email`)
- Runtime: Cloudflare Workers / TanStack Start (no SMTP, no TCP, no Nodemailer)
- Integration: piggybacks on existing notification system (`notifications`,
  `notification_templates`, `notification_preferences`, `notification_delivery_logs`)
- Every event creates an in-app notification **and** sends an email (per user
  prefs) via a single `dispatchNotification` call — no parallel pipelines.

## Files

Created:
- `src/lib/email/brevo.client.ts` — HTTP client + `pingBrevo()` health probe
- `src/lib/email/templates.ts` — branded HTML/text wrapper
- `src/lib/email/send-email.server.ts` — retry + delivery logging
- `src/lib/email/events.server.ts` — typed event helpers (welcome, payment.*,
  academy.*, hub.*, tech.*, platform.*)
- `src/lib/email/launch-readiness.server.ts` — `checkEmailHealth()` checks
- `src/lib/email/__tests__/brevo.test.ts` — provider + template + retry tests

Modified:
- `src/lib/notifications/service.server.ts` — replaced the broken
  `enqueue_email` RPC path with a direct call to `sendEmail()` (Brevo).
  In-app insert + email send + delivery log still happen in one dispatch.

## Environment Variables

| Var | Required | Default |
| --- | --- | --- |
| `BREVO_API_KEY` | yes | — |
| `EMAIL_FROM_ADDRESS` | no | `notifications@higaet.com` |
| `EMAIL_FROM_NAME` | no | `HIGAET` |
| `EMAIL_REPLY_TO` | no | `support@higaet.com` |

## How to trigger an email

```ts
// from any server function:
const { sendPaymentApproved } = await import("@/lib/email/events.server");
await sendPaymentApproved({
  userId,
  eventId: paymentId,
  vars: { amount: "₦25,000", reference: "PAY-123" },
});
```

`dispatchNotification` continues to be the primary API for anything not
covered by `events.server.ts`.

## Launch-readiness checks

Call `checkEmailHealth()` from your launch-readiness pipeline:

- `brevo_api_reachable` — pings `/v3/account`
- `email_success_rate_24h` — sent vs total (fail < 80%, warn < 95%)
- `email_failed_count_24h` — raw failure count
- `email_last_successful_send` — last `sent` timestamp
- `email_pending_backlog` — pending delivery log rows

## Templates

Subjects/bodies/CTAs are stored in `notification_templates` (existing table)
and rendered with `renderTemplate()` into the branded HTML shell defined in
`templates.ts`. Add new content per event by inserting rows with
`channel = 'email'` for the event key — no code change required.

Default fallback content is provided in `events.server.ts` for every P0 event
in the inventory, so emails ship even before templates are seeded.

## Admin / observability

- Delivery rows land in `notification_delivery_logs` with
  `provider = 'brevo'`, `provider_message_id`, `error`, `attempts`.
- Existing admin notification routes already render this table; failure
  reasons and Brevo message IDs are visible without further changes.

## Tests

`bunx vitest run src/lib/email` covers:
- HTTP client success / error
- HTML escape + CTA rendering
- Retry on 5xx, no retry on 4xx
