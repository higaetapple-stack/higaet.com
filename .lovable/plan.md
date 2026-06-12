
# HIGAET — Phase 1 Build Plan

Public-facing ecosystem for HIGAET and its three divisions, built on TanStack Start (the Lovable modern stack). Designed API-first so the production Node.js + MySQL backend on MilesWeb can replace the dev backend without frontend rewrites.

## 1. Scope of this phase

In scope:
- Main HIGAET site (Home, About, Careers, Blog, Contact)
- HIGAET Academy (10 pages)
- HIGAET Global Education Hub (10 pages)
- HIGAET Technologies (10 pages)
- Unified design system with per-division accent identity
- SEO + AEO + GEO + AIO foundation across every route
- GA4 + GTM + Meta Pixel + Search Console wiring
- Blog CMS (content layer), Careers listing, Contact + lead-capture forms
- Auth scaffolding (login/register UI + session plumbing, no role dashboards yet)
- PWA installability (manifest + icons, no offline cache)
- Sitemap + robots + JSON-LD on every shareable route

Out of scope (later phases): dashboards, LMS, admissions workflow, payments, certificates, AI assistant, native apps.

## 2. Information architecture

```
/                                  HIGAET main
/about
/careers
/careers/$slug
/blog
/blog/$slug
/contact

/academy                           Division 1 (upGrad-style)
/academy/online-courses
/academy/offline-training
/academy/certifications
/academy/placements
/academy/internships
/academy/corporate-training
/academy/success-stories
/academy/faq
/academy/contact

/global-education                  Division 2 (MSM Unify-style)
/global-education/study-abroad
/global-education/universities
/global-education/scholarships
/global-education/countries
/global-education/visa-guidance
/global-education/student-services
/global-education/admission-process
/global-education/faq
/global-education/contact

/technologies                      Division 3 (Orient-style)
/technologies/software-development
/technologies/saas-products
/technologies/ai-solutions
/technologies/digital-marketing
/technologies/product-development
/technologies/case-studies
/technologies/case-studies/$slug
/technologies/industries
/technologies/careers
/technologies/contact

/auth/login                        Scaffolding only
/auth/register
/auth/forgot-password

/sitemap.xml                       Server route
/robots.txt
/manifest.webmanifest
```

Each division has its own layout route that injects its accent identity, division-level nav, footer, and JSON-LD `Organization` / `EducationalOrganization` block.

## 3. Design system

One HIGAET design system, four visual identities:

| Brand | Accent role | Reference language |
|---|---|---|
| HIGAET (parent) | Neutral + signature accent | Corporate, trustworthy |
| Academy | Learning accent | upGrad — bold, conversion-led |
| Global Education Hub | Global accent | MSM Unify — open, aspirational |
| Technologies | Engineering accent | Orient — sharp, B2B |

Shared: typography scale, spacing, radii, motion, components (button, card, nav, hero, form, FAQ, testimonial, stat, CTA section, footer), focus rings, dark mode.

Per-brand: CSS variables for primary/accent/gradient/shadow, hero imagery direction, iconography weight. All values as semantic tokens in `src/styles.css` — no hardcoded colors in components.

Will generate visual design directions for the parent brand at build time and confirm before applying division accents.

## 4. SEO / AEO / GEO / AIO

Per-route via TanStack `head()` (no `react-helmet`):
- Unique `title`, `description`, `og:title`, `og:description`, `og:url` on every leaf
- Canonical link on leaves only (avoids the TanStack root-concat bug)
- JSON-LD per route type: `Organization` + `WebSite` at root; `EducationalOrganization` on division roots; `Course` on course pages; `Article` on blog posts; `FAQPage` on FAQ routes; `BreadcrumbList` on deep routes; `JobPosting` on career listings; `Service` on tech service pages
- Semantic HTML, single H1 per route, ordered H2/H3 outlines
- AEO: dedicated FAQ blocks with question-answer schema; concise lead paragraphs; entity-named sections
- GEO/AIO: knowledge-hub style content blocks, clear entity relationships (Academy ↔ Course ↔ Faculty, Global Ed ↔ University ↔ Country ↔ Scholarship), machine-readable structured data on every entity page
- `public/robots.txt` + dynamic `src/routes/sitemap[.]xml.ts` driven by route list + CMS data
- Core Web Vitals: route-level code splitting (free with TanStack), image lazy-loading + responsive `srcset`, font-display swap, LCP image preload per route

## 5. Analytics & marketing

Centralized loader (env-driven IDs, can be flipped per environment):
- GTM container in root `head()` with consent gate
- GA4 via GTM (page_view auto, custom events: form_submit, lead_capture, cta_click, file_download, outbound_click, search, video_play)
- Meta Pixel via GTM (PageView, Lead, Contact, CompleteRegistration, ViewContent)
- Search Console verification meta tag (env-driven)
- Microsoft Clarity, LinkedIn Insight Tag, Bing — slots ready, off until IDs are set
- Consent: minimal cookie banner, GA/Pixel respect denied state

All IDs read from env (`VITE_GTM_ID`, `VITE_GA4_ID`, `VITE_META_PIXEL_ID`, `VITE_GSC_TOKEN`, `VITE_CLARITY_ID`, etc.). Empty = tag does not load.

## 6. API-first foundation

So the future Node/Express/MySQL backend can drop in cleanly:

- All data access goes through a single `src/lib/api/` client (typed fetch wrapper, base URL from `VITE_API_BASE_URL`, JWT bearer interceptor, error normalizer)
- Domain modules: `auth`, `blog`, `careers`, `leads`, `courses`, `universities`, `countries`, `scholarships`, `case-studies`, `services`, `industries`, `contact`
- Each module exports typed functions: `listBlogPosts()`, `getBlogPost(slug)`, `submitLead(payload)`, etc.
- During Phase 1 these call Lovable Cloud server functions that read from Postgres (so the site is fully functional immediately)
- Swap point documented: replace base URL + drop in MySQL-backed Express endpoints with the same DTOs — no UI changes required
- Shared DTO types in `src/types/` mirror the planned MySQL schema (users, roles, blog_posts, careers, leads, courses, universities, countries, scholarships, case_studies, services, industries, contacts, media)
- Zod validation on every form payload, client + server

Auth scaffolding: login / register / forgot-password screens, session context, protected-route helper, JWT storage strategy. Backend stub via Lovable Cloud auth; swappable for the production Node JWT issuer in Phase 2.

## 7. CMS foundation

Lightweight content model so Phase 1 isn't static:
- Blog posts (title, slug, excerpt, body MDX, hero image, author, tags, published_at)
- Career listings (role, location, type, description, requirements, slug)
- Case studies (title, slug, client, industry, summary, body, hero, metrics)
- Lead submissions (form_source, name, email, phone, message, division, utm_*)
- Contact messages
- Newsletter subscribers

Stored in Lovable Cloud (Postgres) with RLS during Phase 1; export path to MySQL documented for migration.

## 8. PWA (manifest-only)

- `public/manifest.webmanifest` with HIGAET name/short_name/theme/background
- Icon set (192, 512, maskable, apple-touch)
- `theme-color` + `apple-touch-icon` in root `head()`
- No service worker in Phase 1 (offline isn't requested)

## 9. Quality bars

- Strict TypeScript everywhere
- No hardcoded colors in components — only design tokens
- Reusable section components: `Hero`, `FeatureGrid`, `StatBand`, `LogoCloud`, `Testimonials`, `FAQ`, `CTASection`, `Pricing`, `Timeline`, `TeamGrid`, `ContactBlock`
- Mobile-first responsive at every breakpoint
- WCAG AA: focus states, contrast, semantic landmarks, skip-to-content
- Lighthouse target: 90+ on Performance, Accessibility, Best Practices, SEO for every route
- Form validation with Zod + accessible error messages
- 404 and error boundaries on every route

## 10. Build order

1. Design system + parent brand visual direction (confirm with you)
2. Root shell, root SEO/analytics, layout primitives, section components
3. Main HIGAET site (Home, About, Careers, Contact)
4. Blog CMS + blog routes
5. HIGAET Academy (10 pages, accent identity)
6. HIGAET Global Education Hub (10 pages, accent identity)
7. HIGAET Technologies (10 pages, accent identity)
8. Auth scaffolding
9. Lead capture wiring + analytics events
10. Sitemap, robots, manifest, JSON-LD audit, Lighthouse pass

## 11. What I'll confirm before building

- Brand colors / typography direction (I'll generate 2–3 design directions for the parent brand)
- Whether to enable Lovable Cloud now for the CMS/lead backend (recommended) vs static JSON until your Node backend is ready
- Whether to include the cookie consent banner now or defer to Phase 2

Once you approve, I'll start with the design system and the main HIGAET site.
