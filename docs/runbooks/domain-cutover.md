# Domain Cutover

Activating `*.higaet.com` subdomains.

## Subdomains
| Host | Routes |
| --- | --- |
| academy.higaet.com | Academy programs, courses, enrollments |
| hub.higaet.com | Global Education student + counselor portals |
| ai.higaet.com | AI Hub, Copilot, RAG admin |
| docs.higaet.com | Public docs, API reference |
| api.higaet.com | `/api/v1/*` partner API |
| auth.higaet.com | Sign-in, MFA, OAuth callbacks |

## Pre-cutover checklist
- [ ] HostGate route map covers every subdomain (`src/components/site/HostGate.tsx`)
- [ ] Sitemap server route emits host-scoped entries
- [ ] `public/robots.txt` per host (or dynamic route)
- [ ] OAuth redirect URIs updated in identity providers
- [ ] Notification templates use `https://<host>.higaet.com` not preview URL

## Cutover
1. In Lovable Project Settings → Domains, **Connect Domain** for each subdomain (proxy mode if behind Cloudflare).
2. At registrar/Cloudflare: add A `185.158.133.1` (or CNAME in proxy mode) plus TXT `_lovable`.
3. Wait for status `Active` (SSL provisioned). DNSChecker.org for propagation.
4. Smoke test each subdomain: home, sign-in redirect, one authenticated route.
5. Update `BASE_URL` in `src/routes/sitemap[.]xml.ts` for each tenant.

## Rollback
Remove the custom domain in Project Settings; traffic falls back to the preceding host within ~5 min.

## Cross-subdomain auth
See `cross-subdomain-auth.md` (Sprint B) — cookie domain must be `.higaet.com` for shared session.
