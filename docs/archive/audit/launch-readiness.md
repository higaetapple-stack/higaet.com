# HIGAET — Launch Readiness Scorecard (Phase 11A)

_Date: 2026-06-22_

## Surface scorecard

| Area | Status | Notes |
|---|---|---|
| Academy | **Ready** | Programs/courses/lessons/assignments/certificates shipped, RLS clean |
| Global Education | **Ready** | Phase 9A/9B complete (workflow status, counselor portal) |
| Community | **Ready** | Threads, replies, events, RSVPs, moderation |
| AI Hub | **Needs Work** | Consolidate assistants (A1); add per-collection allow-list (AI1) |
| API Platform | **Needs Work** | Missing rate-limit middleware (API1) |
| Webhooks | **Ready** | HMAC verified, leased dispatch with retry/backoff |
| Security | **Needs Work** | AAL2 gate (S1), trigger-fn EXECUTE revoke (S2a) |
| Observability | **Ready** | `/dashboard/admin/system` operational |
| Multi-host | **Blocked** | Awaiting DNS activation (Phase 10C) |
| Payments | **Blocked** | PAN/TAN/Razorpay onboarding pending |
| Notifications | **Ready** | Delivery logs + preferences |
| MFA / SSO | **Ready** | Identity providers + recovery codes |

## Go / No-Go recommendation

**Conditional GO** for soft launch (invite-only, no public sign-ups) **after** P0/P1 fixes in `critical-fixes.md`.

**No-Go** for full public launch until:
1. All P1 security items closed.
2. Payments unblocked OR launched with explicit "free during beta" messaging.
3. Domain activation (10C) complete.
4. Synthetic load test passes (perf P1d).

## Pre-launch checklist

- [ ] P0/P1 items in `critical-fixes.md` resolved
- [ ] Backups verified (point-in-time restore tested)
- [ ] Runbook: how to rotate `LOVABLE_API_KEY`, API keys, webhook secrets
- [ ] Runbook: how to drain `ai_embeddings_queue` if stuck
- [ ] On-call rotation defined
- [ ] Status page wired to `system_health`
- [ ] Legal: T&Cs, privacy, refund policy, data-processing addendum
- [ ] Email deliverability: SPF/DKIM/DMARC verified on `*.higaet.com`
- [ ] Cookie consent / GDPR banner if EU traffic expected
