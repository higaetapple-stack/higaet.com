# Zero-Downtime DNS Migration SOP — higaet.com → Lovable Edge

**Companion to:** `dns-cutover-plan.md` (record-level reference)
**This doc:** the *procedure* — TTL pre-stage, staged cutover, validation gates, rollback window.

---

## 1. Objective

Switch `higaet.com` from legacy cPanel (`103.102.234.161`) to Lovable Edge (`185.158.133.1`) with **zero user-visible downtime** and an **instant rollback path**, while preserving email and SSR/server-function behavior.

## 2. Core principle

DNS is changed **gradually and verifiably**, never blindly:
- TTL reduction → faster propagation + faster rollback.
- Parallel validation on Lovable URL before flipping.
- Verification gates at each phase.
- Rollback window held open for 24h.

---

## 3. Pre-migration checklist (mandatory)

**Code (already complete ✔)**
- [x] Canonical = `https://higaet.com`
- [x] `BASE_URL` in `src/routes/sitemap[.]xml.ts` = `https://higaet.com`
- [x] `ACADEMY_SITEMAP_BASE_URL` = `https://higaet.com`
- [x] `public/robots.txt` references `https://higaet.com/sitemap.xml`
- [x] SSR + server functions intact

**Infrastructure (pending)**
- [ ] Hostinger DNS access confirmed
- [ ] Lovable Project Settings → Domains: `higaet.com` + `www.higaet.com` added (status `Verifying` OK)
- [ ] `_lovable` TXT verification value copied
- [ ] Existing MX / SPF / DKIM / DMARC documented (screenshot zone)

---

## 4. Phase 1 — TTL reduction (T-24h)

**Goal:** Shorten DNS cache so cutover propagates in minutes, not hours.

In Hostinger DNS, set TTL = **300s** on:
- `A @` (currently → `103.102.234.161`)
- `A www`

**Wait 24h.** Do not modify any other record. This is a no-op for users; it only shrinks the propagation envelope for Phase 3.

---

## 5. Phase 2 — Staging validation (T-1h)

Before flipping, prove the Lovable origin is healthy:

```bash
curl -sI https://higaet-ecosystem-core.lovable.app | head -1   # HTTP/2 200
curl -s  https://higaet-ecosystem-core.lovable.app/sitemap.xml | head -3
curl -s  https://higaet-ecosystem-core.lovable.app/robots.txt
```

Browser:
- [ ] Homepage SSR renders (view source contains real HTML, not just shell)
- [ ] `/academy`, `/technologies`, `/global-education` load
- [ ] Lovable Domains UI shows `higaet.com` ready to verify

---

## 6. Phase 3 — Cutover (T-0)

**Hostinger DNS, in order:**

1. Replace `A @ → 103.102.234.161` with `A @ → 185.158.133.1` (TTL 300)
2. Replace `A www → 103.102.234.161` with `A www → 185.158.133.1` (TTL 300)
3. Add `TXT _lovable → lovable_verify=<value>` (TTL 300)

**Do NOT touch:** MX, SPF (`v=spf1 ...`), DKIM (`default._domainkey`), DMARC (`_dmarc`), Google verification TXT.

Note the exact UTC timestamp of save — this anchors the rollback window.

---

## 7. Phase 4 — Live verification (T+0 to T+30min)

Poll every 5 minutes until all pass:

```bash
# Resolution
dig +short higaet.com @1.1.1.1            # → 185.158.133.1
dig +short higaet.com @8.8.8.8            # → 185.158.133.1
dig +short www.higaet.com @1.1.1.1        # → 185.158.133.1

# Origin
curl -sI https://higaet.com               # HTTP/2 200, server: cloudflare
curl -sI https://www.higaet.com           # 301 → https://higaet.com

# SSR (must contain rendered HTML, not just <div id="root">)
curl -s https://higaet.com/academy | grep -o "<title>[^<]*</title>"

# SEO surface
curl -s https://higaet.com/robots.txt | grep "Sitemap: https://higaet.com"
curl -s https://higaet.com/sitemap.xml | grep -c "<loc>https://higaet.com"   # > 0

# Email untouched
dig +short MX higaet.com                  # unchanged from pre-cutover
```

Lovable Domains UI must transition: `Verifying` → `Setting up` → **`Active`**.

---

## 8. Coexistence window (T+0 to T+24h)

During TTL-driven propagation, some resolvers return old IP, some new. **This is expected.**

Rules during this window:
- 🚫 No app deploys
- 🚫 No DNS edits
- 🚫 No content/route changes
- ✅ Monitor only

---

## 9. Rollback (instant, any time within 24h)

If SSL fails, app unreachable globally, or email breaks:

```text
A @     → 103.102.234.161
A www   → 103.102.234.161
```

Propagation back: 5–15 min at TTL 300. App stays reachable at `https://higaet-ecosystem-core.lovable.app` throughout. **No code rollback needed.** Then disconnect domain in Lovable Domains UI and file an incident note with the exact failure (DNS / SSL provisioning / SSR / email) before retrying.

---

## 10. Success criteria — mark ACTIVE only when ALL true

- [ ] `higaet.com` resolves to `185.158.133.1` from 1.1.1.1, 8.8.8.8, 9.9.9.9
- [ ] Lovable Domains status = **Active** for both apex and www
- [ ] HTTPS valid, no mixed-content warnings
- [ ] SSR HTML present on `/`, `/academy`, `/technologies`, `/global-education`
- [ ] `/sitemap.xml` served by Lovable, all `<loc>` on `higaet.com`
- [ ] `/robots.txt` references correct sitemap URL
- [ ] Test email to `hello@higaet.com` delivered and replied
- [ ] No 5xx in Lovable logs for 30 consecutive minutes

---

## 11. Post-migration freeze

| Surface | Freeze duration |
|---|---|
| DNS records | 24h |
| Architecture (routes, providers, registry) | 48h |
| SEO structure (canonical, sitemap shape, robots) | 72h |

Hotfixes allowed; structural changes not.

---

## 12. Trigger for next phase

When status = **ACTIVE** and freeze windows pass:
1. Resubmit `https://higaet.com/sitemap.xml` in Google Search Console
2. Resume **Workstream B Step 8** (Academy consumer migration)
3. Run production SSR + route stress verification

---

## 13. Out of scope

- cPanel hosting → retained for email only
- Subdomain architecture (`app.`, `academy.`) → not introduced
- Code changes → none; canonical alignment already complete
