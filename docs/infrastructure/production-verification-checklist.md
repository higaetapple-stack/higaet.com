# HIGAET Production Verification Checklist

**Post-DNS cutover validation for `higaet.com` → Lovable Edge**

Companion to:
- `dns-cutover-plan.md` — DNS record reference
- `dns-migration-sop.md` — staged cutover procedure

Run this **only after** DNS cutover is executed and Lovable Domains status reaches `Active`. Mark **PRODUCTION ACTIVE** only when every section passes.

---

## 1. Infrastructure layer

### 1.1 DNS resolution
```bash
dig +short higaet.com @1.1.1.1            # → 185.158.133.1
dig +short higaet.com @8.8.8.8            # → 185.158.133.1
dig +short www.higaet.com @1.1.1.1        # → 185.158.133.1
dig +short MX higaet.com                  # unchanged (cPanel mail)
```
- [ ] Apex resolves to `185.158.133.1` from 3 resolvers
- [ ] `www` resolves to `185.158.133.1`
- [ ] MX records unchanged

### 1.2 SSL + edge headers
```bash
curl -sI https://higaet.com | head -20
curl -sI https://www.higaet.com | head -5    # 301 → https://higaet.com
```
- [ ] HTTP/2 200, valid cert (no warnings)
- [ ] `server: cloudflare` present
- [ ] **No** Apache / cPanel / `X-Powered-By: PHP` headers
- [ ] `www` 301-redirects to apex

---

## 2. Application layer

### 2.1 SSR HTML present (not just hydration shell)
```bash
for p in / /about /academy /technologies /global-education /status /contact; do
  echo "=== $p ==="
  curl -s "https://higaet.com$p" | grep -o "<title>[^<]*</title>"
done
```
- [ ] Every route returns a route-specific `<title>` in the raw HTML
- [ ] No "Lovable App" / placeholder titles
- [ ] No console hydration mismatch errors in browser DevTools

### 2.2 Server functions
- [ ] Lead form submit succeeds (`/contact`)
- [ ] Academy programs page renders (server-fetched data visible in view-source)
- [ ] No 5xx in browser Network tab over 5 min of clicking

---

## 3. SEO surface

### 3.1 Canonical + OG (spot-check 5 routes)
```bash
curl -s https://higaet.com/academy | grep -E 'rel="canonical"|og:url|og:title'
```
- [ ] `canonical` resolves to `https://higaet.com/academy` (not preview, not subdomain)
- [ ] `og:url` matches canonical
- [ ] Route-specific `og:title` / `og:description`

### 3.2 Sitemap
```bash
curl -s https://higaet.com/sitemap.xml > /tmp/sm.xml
xmllint --noout /tmp/sm.xml && echo OK
grep -c "<loc>https://higaet.com" /tmp/sm.xml          # > 0
grep -c "lovable.app\|cpanel\|wordpress" /tmp/sm.xml   # → 0
```
- [ ] Valid XML
- [ ] All `<loc>` on `higaet.com`
- [ ] Zero legacy artifacts

### 3.3 Robots
```bash
curl -s https://higaet.com/robots.txt
```
- [ ] Contains `Sitemap: https://higaet.com/sitemap.xml`
- [ ] No blanket `Disallow: /`

---

## 4. Backend (Lovable Cloud)

- [ ] Auth: sign-in / sign-out round-trip works
- [ ] No redirect loops on `/_authenticated/*` routes
- [ ] DB-backed pages (academy programs, jobs, blog) render fresh data
- [ ] No 401/500 in Network tab during normal browsing

---

## 5. Legacy origin safety (critical)

```bash
# Should NOT contain Apache, cPanel, X-Powered-By: PHP, or X-Server: cPanel
curl -sI https://higaet.com | grep -iE 'apache|cpanel|php|litespeed' && echo "❌ FAIL" || echo "✅ clean"
```
- [ ] Zero cPanel / Apache / PHP signatures
- [ ] `cf-ray` header present (Cloudflare edge served the response)

---

## 6. Performance

- [ ] TTFB < 300ms (apex, from at least 2 regions)
- [ ] JS/CSS bundles served from edge (cache headers present)
- [ ] No blocked / 404 assets in Network tab
- [ ] Lighthouse Performance ≥ 80 on `/` and `/academy`

---

## 7. PASS criteria — PRODUCTION ACTIVE

Mark **ACTIVE** only when all of §1–§6 pass **and**:
- [ ] No 5xx in Lovable logs for 30 consecutive minutes
- [ ] Test email to `hello@higaet.com` delivered + replied (email unaffected)
- [ ] Google Search Console: `https://higaet.com/` inspectable, sitemap submitted

---

## 8. Post-pass freeze

| Surface | Freeze |
|---|---|
| DNS | 24h |
| Canonical / sitemap structure | 72h |
| Route topology | 48h |

Hotfixes allowed; structural changes blocked.

---

## 9. Failure → rollback

Any failed check in §1, §2, §5 within the 24h window → execute rollback in `dns-migration-sop.md` §9. Log the failing check ID before reverting.

---

## 10. Next phase trigger

When PRODUCTION ACTIVE confirmed + freezes elapsed:
1. Resume **Workstream B Step 8** (Academy consumer migration)
2. Begin SEO indexing acceleration (resubmit sitemap, request indexing for top 20 routes)
3. Activate production monitoring (uptime, TTFB, 5xx rate, Core Web Vitals)
