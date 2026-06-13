# HIGAET Academy — Phase 1

Build Phase 1 of HIGAET Academy inside the existing TanStack Start codebase, reusing the established design system, component library, SEO framework, analytics, and routing patterns. No separate project, no duplicate infrastructure.

## Scope (this phase only)

1. Activate the Academy brand identity within the shared design system
2. Academy route shell + layout under `/academy`
3. Academy Homepage (`/academy`)
4. Academy Navigation (sticky sub-header bound to `data-brand="academy"`)
5. Academy Mega Menu (categories, learning paths, top courses, CTAs)
6. Academy Search (client-side, course/category index — API-ready)

Out of scope: Course Detail, Learning Paths, Offline Training, Placements, Faculty, FAQ, Contact (Phases 2–5).

## Architecture

- **Route group**: All Academy pages live under `src/routes/academy.*.tsx`. Phase 1 creates the layout file `academy.tsx` (renders `<Outlet />` inside an Academy-branded `SiteShell`) and `academy.index.tsx` (the homepage).
- **Brand scoping**: Wrap the Academy subtree in a container with `data-brand="academy"`. All Academy-specific accent utilities resolve through the existing `--academy` / `--academy-soft` tokens (already defined in `src/styles.css`). No hardcoded colors in components.
- **Reused components** (no duplication): `Container`, `Section`, `PageHero`, `FeatureGrid`, `StatBand`, `CTASection`, `TrustedBy`, `TestimonialCarousel`, `FAQ`, `Breadcrumbs`, `JsonLd`, `LeadForm`, `CookieConsent`, `Footer`, `SiteShell`, analytics + cookie consent.
- **Academy-only components** (new, only where behavior genuinely differs):
  - `AcademyHeader.tsx` — sub-header with Academy nav + mega menu trigger + search trigger (sits below the shared HIGAET ecosystem `Header`, scoped to `/academy/*`)
  - `AcademyMegaMenu.tsx` — accessible mega panel: Categories · Popular Courses · Learning Paths · Resources · CTA
  - `AcademySearch.tsx` — command-palette-style overlay (⌘K / `/`), debounced filter over the in-memory index, keyboard nav, ARIA combobox
  - `CourseCard.tsx` — preview card used by mega menu, homepage rails, and future course listings
  - `CategoryTile.tsx` — category entry with icon, blurb, course count
  - `LearningPathCard.tsx` — path preview (duration, level, outcomes)

## Content registries (API-ready)

All Phase 1 content lives in typed registries under `src/content/academy/` so they can be swapped for the future Node.js + Express + MySQL backend without touching components.

- `src/content/academy/categories.ts` — 16 categories: AI, Generative AI, Machine Learning, Data Science, Python, Full-Stack, React, Node.js, Cloud, DevOps, Cybersecurity, UI/UX, Business Analytics, Software Testing, Digital Marketing, Career Development
- `src/content/academy/courses.ts` — ~24 original course entries (title, slug, category, level, duration, summary, outcomes[], skills[], prerequisites[], careerOutcomes[], faqs[]) — Phase 1 surfaces them on the homepage and in search; detail pages arrive in Phase 2
- `src/content/academy/learning-paths.ts` — ~6 learning paths (e.g., GenAI Engineer, Full-Stack Developer, Data Scientist) with sequenced course slugs
- `src/content/academy/search-index.ts` — flattened search records derived from the registries (course + category + path titles, summaries, tags)
- `src/content/academy/testimonials.ts` — clearly labeled placeholder testimonials (TODO marker on names + photos)

All content is original, written for HIGAET Academy's positioning; no copying of upGrad or competitor copy.

## Homepage sections (`/academy`)

1. Brand-scoped hero — "Future-ready learning for AI, software, and technology careers" + dual CTA (Browse Courses, Talk to a Counsellor) + integrated search input
2. Trust band — placeholder partner/recruiter logos (TODO-marked)
3. Top categories grid (16 tiles → category landing, Phase 2)
4. Featured Learning Paths (3-card carousel)
5. Popular Courses rail (6 cards)
6. Why HIGAET Academy — 4-feature grid (mentorship, projects, placements, certification)
7. Outcomes stat band — placeholder metrics (TODO-marked)
8. Student stories — `TestimonialCarousel` (placeholder)
9. FAQ — 6 Academy-specific questions (Course schema-aware)
10. Lead capture CTA — reuses `LeadForm` (source: `academy_home`)

## Navigation & Mega Menu

- Shared HIGAET `Header` stays as the ecosystem-wide top bar (Home / Academy / Global Education Hub / Technologies / About / Contact)
- `AcademyHeader` mounts inside `academy.tsx` layout, below the shared header, with: Courses ▾ (mega menu), Learning Paths, Certifications, Placements, Corporate Training, Search, "Apply Now" CTA
- Mega menu opens on hover (desktop) / click (touch), closes on Esc / outside click, traps focus, returns focus to trigger
- Mobile: collapses into an accordion drawer

## Search

- Trigger: search icon, `/`, or ⌘K / Ctrl+K
- Overlay with input + grouped results (Courses · Categories · Learning Paths)
- Client-side fuzzy match over `search-index.ts` (no extra deps — small custom scorer over title/tags/summary)
- Keyboard nav (↑↓ Enter Esc), ARIA `combobox` + `listbox`, screen-reader live region for result count
- Results route to placeholder anchors on `/academy` for Phase 1; deep routes land in Phase 2 (links typed so the future routes are a non-breaking addition)

## SEO / AEO / GEO / AIO

- `/academy` `head()`: unique title, description, canonical, og:title, og:description, og:image (use existing brand asset if available; otherwise omit per leaf-only rule), twitter card
- JSON-LD via `JsonLd`: `EducationalOrganization` (HIGAET Academy), `WebSite` with `SearchAction` pointing at the Academy search, `BreadcrumbList`, `FAQPage` for the homepage FAQ, `ItemList` for Featured Learning Paths and Popular Courses
- Sitemap: extend `src/routes/sitemap[.]xml.ts` with `/academy` (priority 0.9)
- Original content only; semantic headings (single `<h1>`); accessible color contrast verified against `--academy` token

## Analytics

- Reuse existing `src/lib/analytics.ts` (GA4 / GTM / Meta Pixel / Clarity), gated by cookie consent
- Track Phase 1 events: `academy_home_view`, `academy_search_open`, `academy_search_query`, `academy_search_result_click`, `academy_mega_menu_open`, `academy_lead_submit`

## Accessibility & Performance

- Semantic landmarks, single `<main>`, focus management on mega menu and search overlay
- All interactive elements keyboard reachable; visible focus rings using `--ring`
- Code-split: search overlay and mega menu lazy-load on first interaction
- No oversized hero images; text-led design consistent with Technologies

## Files to add / edit

### New
- `src/routes/academy.tsx` (layout, `data-brand="academy"`, `<Outlet />`)
- `src/routes/academy.index.tsx` (homepage)
- `src/components/site/AcademyHeader.tsx`
- `src/components/site/AcademyMegaMenu.tsx`
- `src/components/site/AcademySearch.tsx`
- `src/components/site/CourseCard.tsx`
- `src/components/site/CategoryTile.tsx`
- `src/components/site/LearningPathCard.tsx`
- `src/content/academy/categories.ts`
- `src/content/academy/courses.ts`
- `src/content/academy/learning-paths.ts`
- `src/content/academy/search-index.ts`
- `src/content/academy/testimonials.ts`
- `src/content/academy/index.ts` (barrel)

### Edited
- `src/components/site/Header.tsx` — add "Academy" link to ecosystem nav (no behavior change for Technologies)
- `src/routes/sitemap[.]xml.ts` — append `/academy`
- `src/styles.css` — only if a missing Academy utility surfaces; otherwise unchanged (`--academy` already defined)

## Acceptance criteria

- `/academy` renders with the Academy accent applied via `data-brand`; Technologies pages visually unchanged
- Mega menu and search work via mouse, keyboard, and touch; both pass focus-trap and Esc-close checks
- All content originates from the registries; no string literals duplicated across components
- Lighthouse: Performance ≥ 90, Accessibility ≥ 95, SEO ≥ 95 on `/academy`
- JSON-LD validates (Organization, WebSite+SearchAction, BreadcrumbList, FAQPage, ItemList)
- Sitemap includes `/academy`
- All placeholder assets (logos, photos, testimonials) carry visible `TODO` markers in source comments and registry fields

Stop after Phase 1 and report counts (categories, courses, paths, new routes, new components) before moving on.
