# Deployment & Handover

## Production status
| Area | Status |
|---|---|
| Frontend | ✅ Complete |
| API-ready architecture | ✅ |
| SEO / AEO / GEO / AIO | ✅ |
| Analytics framework | ✅ (IDs pending) |
| Accessibility (WCAG AA) | ✅ |
| Responsive (mobile/tablet/desktop) | ✅ |
| Code freeze | ✅ Baseline locked |
| Backend (Node/Express/MySQL) | ⏳ Future phase |

## Deployment targets
- **Repo**: GitHub (connect via Lovable → GitHub).
- **Domain**: higaet.com (Hostinger DNS → MilesWeb / Lovable).
- **Hosting (current)**: Lovable edge.
- **Hosting (future)**: MilesWeb VPS for Node API + MySQL; frontend can stay on Lovable or move to the VPS.

## Pre-deployment checklist
- [ ] Set `VITE_SITE_URL=https://higaet.com`.
- [ ] Add real GA4 / GTM / Meta Pixel / Clarity IDs.
- [ ] Add Google Search Console verification meta.
- [ ] Replace placeholder client logos / testimonials.
- [ ] Add named leadership bios + headshots.
- [ ] Generate og:image per major route (optional but recommended).
- [ ] Verify Lighthouse ≥ 90 across Performance / SEO / Accessibility / Best Practices.
- [ ] Submit sitemap.xml to GSC + Bing Webmaster.

## Post-launch checklist
- [ ] Monitor 404s in GSC.
- [ ] Verify analytics events firing.
- [ ] Watch Core Web Vitals.
- [ ] Schedule monthly content audit.
- [ ] Begin HIGAET Academy build reusing this design system.

## Handover inventory
- **Architecture**: `docs/ARCHITECTURE.md`
- **Development**: `docs/DEVELOPMENT.md`
- **Integration**: `docs/INTEGRATION.md`
- **Deployment**: this file
- **Routes**: ~148 public routes under `src/routes/`
- **Components**: 36 reusable enterprise components under `src/components/site/`
- **Registries**: `src/content/*.ts` (services, industries, technologies, engagement, case-studies, insights, company)

## Next projects
Reuse the design system (`src/styles.css`), component library (`src/components/site/`), SEO helpers (`src/lib/seo.ts`, `src/lib/jsonld.ts`), analytics (`src/lib/analytics.ts`), and registry pattern for:
- HIGAET Academy
- HIGAET Global Education Hub
