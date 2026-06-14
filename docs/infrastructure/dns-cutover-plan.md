# DNS Cutover Plan — higaet.com → Lovable Edge

**Status:** Pending execution
**Owner:** Infrastructure
**Prereq complete:** Code canonical alignment to `https://higaet.com` ✔ (sitemap, robots, OG, SSR routes)
**Remaining gap:** DNS A records still resolve to legacy cPanel (`103.102.234.161`) instead of Lovable edge (`185.158.133.1`)

---

## 1. Target end state

| Record | Type | Name | Value | TTL |
|---|---|---|---|---|
| Root apex | A | `@` | `185.158.133.1` | 300 |
| WWW | A | `www` | `185.158.133.1` | 300 |
| Verification | TXT | `_lovable` | `lovable_verify=<value from Lovable Domains UI>` | 300 |
| Email (preserve) | MX | `@` | existing MilesWeb/cPanel MX | unchanged |
| Email auth (preserve) | TXT | `@` / `default._domainkey` / `_dmarc` | existing SPF, DKIM, DMARC | unchanged |

**Critical:** Only `A @`, `A www`, and `TXT _lovable` change. **Do not touch MX, SPF, DKIM, DMARC** — email continues to flow through cPanel.

---

## 2. Pre-cutover checklist

- [ ] Confirm current DNS provider is **Hostinger** (nameservers `ns1.dns-parking.com` / `ns2.dns-parking.com`).
- [ ] Snapshot existing DNS zone (export or screenshot all records).
- [ ] Record current resolution: `dig higaet.com +short` → expect `103.102.234.161`.
- [ ] Record current MX: `dig higaet.com MX +short` (must be unchanged after cutover).
- [ ] Verify app build is green on Lovable preview: <https://higaet-ecosystem-core.lovable.app>.
- [ ] Verify `/sitemap.xml` and `/robots.txt` serve correctly on the Lovable URL.

---

## 3. Cutover steps

### Step 1 — Initiate connection in Lovable
1. Project Settings → Project → **Domains** → **Connect Domain**.
2. Enter `higaet.com`. Lovable shows the required A record (`185.158.133.1`) and TXT verification value.
3. Repeat: **Connect Domain** → `www.higaet.com` (same A target).
4. Copy the `_lovable` TXT value shown by Lovable.

### Step 2 — Update Hostinger DNS
In Hostinger DNS zone editor for `higaet.com`:

1. **Delete** existing `A @ → 103.102.234.161`.
2. **Add** `A @ → 185.158.133.1`, TTL 300.
3. **Delete or update** existing `A www → 103.102.234.161` (or CNAME).
4. **Add** `A www → 185.158.133.1`, TTL 300.
5. **Add** `TXT _lovable → lovable_verify=<value>`, TTL 300.
6. **Leave untouched:** all MX records, SPF (`TXT @ v=spf1 ...`), DKIM (`TXT default._domainkey ...`), DMARC (`TXT _dmarc ...`), Google site verification TXT.

### Step 3 — Wait for propagation
- Typical: 10–60 minutes with TTL 300.
- Worst case: up to 72 hours.
- Monitor: <https://dnschecker.org/#A/higaet.com> until global propagation shows `185.158.133.1`.

### Step 4 — Lovable verification + SSL
1. Back in Project Settings → Domains, wait for status to transition:
   `Verifying` → `Setting up` → **`Active`**.
2. Lovable auto-provisions SSL via Let's Encrypt once DNS verifies.
3. Set `higaet.com` as **Primary** domain (so `www` 301s to apex).

---

## 4. Verification checklist (post-cutover)

Run from a terminal:

```bash
# DNS resolution
dig higaet.com +short              # expect 185.158.133.1
dig www.higaet.com +short          # expect 185.158.133.1
dig higaet.com MX +short           # expect UNCHANGED (cPanel mail)

# HTTPS + SSL
curl -sI https://higaet.com | head -1        # expect HTTP/2 200
curl -sI https://www.higaet.com | head -1    # expect HTTP/2 301 → https://higaet.com

# SEO surface
curl -s https://higaet.com/robots.txt | grep Sitemap
# expect: Sitemap: https://higaet.com/sitemap.xml

curl -s https://higaet.com/sitemap.xml | grep -c "<loc>https://higaet.com"
# expect: > 0, all <loc> entries on higaet.com

# SSR sanity (server-rendered HTML, not just shell)
curl -s https://higaet.com/academy | grep -i "<title>"

# Email still flows
dig higaet.com TXT +short | grep spf1     # SPF present
dig default._domainkey.higaet.com TXT +short  # DKIM present
dig _dmarc.higaet.com TXT +short          # DMARC present
```

Browser checks:
- [ ] `https://higaet.com` loads the Lovable app (not cPanel default page).
- [ ] Padlock shows valid Lovable-issued SSL cert.
- [ ] `https://www.higaet.com` redirects to apex.
- [ ] `https://higaet.com/sitemap.xml` returns XML with `higaet.com` URLs.
- [ ] Send + receive a test email to `hello@higaet.com` (mail unaffected).
- [ ] Google Search Console → Inspect `https://higaet.com/` → "URL is on Google" or submit re-index.

---

## 5. Rollback plan

If app is unreachable, SSL fails after 72h, or email breaks:

1. Hostinger DNS:
   - Revert `A @ → 103.102.234.161`
   - Revert `A www → 103.102.234.161`
   - Remove `TXT _lovable` (optional, harmless to leave)
2. Wait 10–60 min for propagation.
3. Verify: `dig higaet.com +short` → `103.102.234.161`.
4. In Lovable Domains UI, **Disconnect** `higaet.com` and `www.higaet.com`.
5. App remains reachable at `https://higaet-ecosystem-core.lovable.app`.
6. File issue with exact failure mode (DNS not propagating, SSL provisioning failed, content not served) before retrying.

---

## 6. Post-cutover follow-ups

- [ ] Resubmit `https://higaet.com/sitemap.xml` in Google Search Console.
- [ ] Update any external integrations hardcoded to the Lovable subdomain (analytics, OAuth callbacks, webhooks).
- [ ] Resume **Workstream B Step 8** (Academy consumer migration) only after status is `Active` and verification checklist is 100% green.

---

## 7. Out of scope (do not change in this cutover)

- cPanel / MilesWeb hosting account → retained for **email only**.
- WordPress / PHP / MariaDB → not part of app runtime, untouched.
- Subdomain architecture (`app.`, `academy.`) → not introduced; canonical remains apex `higaet.com`.
- Any code changes → none required; canonical alignment is already complete.
