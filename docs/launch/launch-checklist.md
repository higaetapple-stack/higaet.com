# HIGAET Launch Activation Checklist

Status: **Soft-launch ready.** Production launch gated on four external blockers below.
No new feature phases until at least one item moves to "Ready".

---

## External Blockers

| # | Sprint | Item | Owner | Status | Unblocks |
|---|--------|------|-------|--------|----------|
| 1 | A | DNS & Subdomains | Infra | ⏳ Pending | Sprint B, public routing |
| 2 | B | Cross-Subdomain Auth (`.higaet.com` cookie) | Lovable (after A) | 🔒 Waiting on A | Unified session across hosts |
| 3 | C | Razorpay Onboarding (Business reg, PAN/TAN/GST, account) | Founder | ⏳ Pending | Phase 4A Payments |
| 4 | E | Backup Verification (schedule + restore test) | Infra | ⏳ Pending | Production GO sign-off |

---

## Sprint A — DNS Activation

Connect and verify in Project Settings → Domains:

- [ ] `higaet.com` (root)
- [ ] `academy.higaet.com`
- [ ] `hub.higaet.com`
- [ ] `ai.higaet.com`
- [ ] `docs.higaet.com`
- [ ] `api.higaet.com`
- [ ] `auth.higaet.com`

**Trigger to Lovable when complete:**
> Enable production HostGate mappings and verify shell routing on all connected hostnames.

Wires up: `src/lib/host-gate.ts` production map, per-host shell routing, smoke tests per subdomain.

---

## Sprint B — Cross-Subdomain Authentication

**Prereq:** Sprint A complete and all 7 hostnames `Active`.

**Trigger to Lovable:**
> Configure `.higaet.com` cookie domain support and verify session persistence across academy, hub, ai, docs, api, and auth subdomains.

Work: Supabase auth cookie domain config, session restoration check on each subdomain, regression against `id-preview--*.lovable.app`.

---

## Sprint C — Payments (Phase 4A)

**Prereqs (founder-side):**
- [ ] Business registration
- [ ] PAN / TAN / GST (as applicable)
- [ ] Razorpay account approved for live mode
- [ ] Razorpay key id + secret added via `secrets--add_secret`

**Trigger to Lovable:**
> Resume Phase 4A payment activation using Razorpay production credentials.

Scope: enrollment checkout, invoice payments, signed webhook handler at `/api/public/razorpay-webhook`, payment notification events, reconciliation per `docs/runbooks/payment-failure.md`.

---

## Sprint E — Backup Verification

- [ ] Confirm Lovable Cloud backup schedule
- [ ] Perform restore test against a scratch project
- [ ] Record actual RTO / RPO in `docs/runbooks/database-restore.md`
- [ ] Mark runbook "Verified <date>"

---

## Exit Criteria → Production GO

All four rows above = ✅, plus:

- [ ] Re-run verification audits (security, RAG, API rate limit) — see `docs/audit/verification-*.md`
- [ ] `docs/audit/launch-readiness-final.md` flipped from **Conditional GO** to **GO**
- [ ] On-call rotation acknowledged per `docs/runbooks/README.md`

Until then: no Phase 12 work, no new feature surfaces.
