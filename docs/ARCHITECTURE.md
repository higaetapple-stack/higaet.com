# HIGAET Technologies — Architecture

## Stack
- **Framework**: TanStack Start v1 (React 19, Vite 7, SSR-ready, edge target).
- **Styling**: Tailwind CSS v4 via `src/styles.css` (semantic tokens, dark mode aware).
- **Backend (current)**: Lovable Cloud (Supabase) — auth/db/storage ready, not yet wired to public pages.
- **Backend (future)**: Node.js + Express.js + MySQL (drop-in replacement for in-code registries).

## Folder structure
```
src/
  routes/                 # File-based routes; flat dot-naming
    technologies.*.tsx    # Pillar pages (services, industries, expertise, engagement, case-studies, insights, company)
    sitemap[.]xml.ts      # Dynamic sitemap
    api/public/*          # Webhooks / public APIs (auth bypass)
  components/site/        # Reusable enterprise UI (Nav, DetailPage templates, Footer, LeadForm…)
  components/ui/          # shadcn primitives
  content/                # Registries: services, industries, technologies, engagement, case-studies, insights, company
  lib/                    # analytics, seo, jsonld helpers, *.functions.ts (server fns)
  integrations/supabase/  # Auto-generated client (do not edit)
  styles.css              # Tailwind v4 tokens
```

## Route architecture
- One file per leaf route; dot-separated names map to URL slashes.
- Every route exports `Route = createFileRoute(...)` with `head()` for SEO metadata + JSON-LD.
- Pillar pages share a `*CategoryNav` + `*DetailPage` template; thin route files import the registry entry and the template.

## Registry pattern
Each pillar's content lives in `src/content/<pillar>.ts` as a typed array.
- Routes call `getServiceBySlug(...)` etc. — no fetch logic in the page.
- To migrate to API: replace the in-code registry getters with `createServerFn` handlers that read from MySQL. Page components stay identical.

## Design system
- Tokens (color, radius, surface, ink, muted) defined in `src/styles.css` and exposed via Tailwind utilities (`bg-surface`, `text-ink`, `text-muted-foreground`, etc.).
- Never hardcode colors. Use semantic classes only.
- Typography, spacing, shadows are all token-driven for theme consistency across the HIGAET ecosystem.

## SEO / AEO / GEO / AIO
- Per-route `head()` with unique title, description, og/twitter, canonical.
- JSON-LD via `src/lib/jsonld.ts` (Organization, WebSite, Service, Article, FAQPage, BreadcrumbList, CaseStudy, AboutPage).
- Sitemap auto-includes every pillar registry.
- Internal linking matrix: Services ↔ Industries ↔ Technologies ↔ Case Studies ↔ Insights.

## Analytics
- `src/lib/analytics.ts` reads `VITE_*` IDs; gated by cookie consent.
- Pluggable: GA4, GTM, Meta Pixel, Microsoft Clarity.
