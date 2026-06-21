# Notifications & Event Platform (Phase 3A)

A generic event bus + multi-channel notification service that every HIGAET
feature (Academy, Global Education, Technologies, Career, Community, Payments,
Live Learning) plugs into without duplication.

## Architecture

```
Feature code
   │
   ▼  emitDomainEvent({ eventType, aggregateType, aggregateId, payload })
domain_events  ────────────────────────────────────►  audit / replay
   │
   ▼  dispatchNotification({ userId, eventType, vars, ... })
notification_templates  ──renders──►  channels
   │                                    │
   ▼                                    ├─ in_app  → notifications (realtime)
notification_preferences (per user)     ├─ email   → Lovable email queue
                                        └─ push    → (provider abstraction)
                                                       │
                                                       ▼
                                          notification_delivery_logs
```

## Tables

| Table | Purpose |
|---|---|
| `domain_events` | Append-only event log. Source of truth for "what happened". |
| `notification_templates` | Admin-managed copy per `(event_key, channel, locale)`. |
| `notifications` | Per-user in-app records. Realtime-published. |
| `notification_preferences` | Per-user opt-in/out per `(category, channel)`. |
| `notification_delivery_logs` | Delivery attempts & status for every channel. |

## Server API

All in `src/lib/notifications.functions.ts`:

- `listMyNotifications({ limit, onlyUnread })`
- `getUnreadCount()`
- `markRead({ id })`, `markAllRead()`, `archiveNotification({ id })`
- `getMyPreferences()`, `upsertMyPreference({ category, in_app, email, push })`
- `emitDomainEvent({ eventType, aggregateType, aggregateId, payload })`
- Admin: `adminListTemplates`, `adminUpsertTemplate`, `adminSendTestToSelf`

The service layer lives in `src/lib/notifications/service.server.ts` and is
only loaded via `await import(...)` inside server-function handlers.

## Emitting an event from a feature

```ts
// inside a server function
await context.supabase.rpc("emit_domain_event", {
  _event_type: "certificate.issued",
  _aggregate_type: "certificate",
  _aggregate_id: cert.id,
  _payload: { student_id: cert.student_id, certificate_number: cert.number },
});

// then dispatch a user-facing notification
const { dispatchNotification } = await import("@/lib/notifications/service.server");
await dispatchNotification({
  userId: cert.student_id,
  eventType: "certificate.issued",
  category: "academic",
  vars: { studentName, programTitle, verifyUrl },
  fallback: {
    title: "Your certificate is ready",
    body: "Download it from your dashboard.",
    actionUrl: `/dashboard/certificates/${cert.id}`,
  },
});
```

## Realtime

`notifications` is added to the `supabase_realtime` publication. The
`NotificationBell` subscribes to `postgres_changes` filtered by `user_id` and
invalidates the React Query cache on any change.

## Routes

| Route | Audience | Purpose |
|---|---|---|
| `/dashboard/notifications` | Signed-in user | Full notification feed |
| `/dashboard/notifications/preferences` | Signed-in user | Channel preferences |
| `/dashboard/admin/notifications` | admin / super_admin | Template manager + test send |

## Categories

Defined in `src/lib/notifications/types.ts → NOTIFICATION_CATEGORIES`. Add a
new category there and it appears in preferences and the template editor.

## Domain event catalogue (initial)

```
enrollment.created
enrollment.completed
assignment.graded
certificate.issued
certificate.revoked
visa.status_changed
application.status_changed
proposal.accepted
invoice.paid
payment.received
thread.reply_created
thread.mention
event.reminder
system.alert
```

Extend `DOMAIN_EVENTS` in `types.ts` as new modules emit events.

## Push notifications

The schema and dispatch path include the `push` channel, but no provider is
wired yet. When a provider is chosen (web-push, FCM, OneSignal, etc.), wire it
into `dispatchNotification` under the `push` branch. No table changes needed.

## Tests

`src/lib/notifications/__tests__/template.test.ts` covers the template engine.
