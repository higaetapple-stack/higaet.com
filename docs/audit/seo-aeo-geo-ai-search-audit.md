# HIGAET Final SEO / AEO / GEO / AI Search Audit

**Status:** Read-only audit against the live `src/` implementation. No code changes.
**Date:** 2026-06-28
**Scope:** 303 route files (189 public, ~114 authenticated), `src/lib/seo/*`, `src/lib/site.ts`, root layout, sitemap, robots, llms.txt.
**Canonical domain assumed:** `https://higaet-core-engine.lovable.app` (per project URL config); sitemap currently advertises `https://higaet.com` — **this is a critical mismatch, see §3.1**.

---

## 1. Scores

| Dimension | Score | Grade |
|---|---|---|
| **Overall SEO** | **62 / 100** | C+ |
| Technical SEO | 58 / 100 | C |
| AEO (Answer Engine Optimization) | 64 / 100 | C+ |
| GEO (Generative Engine Optimization) | 60 / 100 | C |
| AI Search readiness (ChatGPT / Perplexity / Gemini / Claude / AI Overviews) | 66 / 100 | C+ |

**Why not higher:** strong JSON-LD foundations on Academy and Global Education pillars are dragged down by (a) missing `robots.txt`, (b) a domain mismatch between sitemap and canonicals, (c) relative URLs in sitewide `Organization`/`WebSite` JSON-LD, (d) canonical coverage at only 35% of public routes, and (e) `_authenticated` routes that should be `noindex` but aren't.

**Why not lower:** the head-tag plumbing is correct (TanStack `head()` in 179 routes), schemas are diverse and well-typed (`Course`, `CollegeOrUniversity`, `FAQPage`, `JobPosting`, `Article`, `TechArticle`, `ProfessionalService`, `EducationalOrganization`), llms.txt exists, sitemap is dynamic and host-aware, and the content depth across Academy + Global Ed is real.

---

## 2. Coverage snapshot (measured, not estimated)

| Signal | Routes covered | Total routes with `head()` | Coverage |
|---|---|---|---|
| `head()` defined | 179 | 303 | 59% |
| `<link rel="canonical">` | 67 | 179 | **37%** |
| `og:url` meta | 49 | 179 | **27%** |
| `og:image` | 4 | 179 | **2%** |
| JSON-LD `application/ld+json` | 25 routes + sitewide | 179 | 14% leaf coverage |
| `noindex` directive | 16 | (should be ~120 across `_authenticated` + utility) | **~13%** |
| `public/robots.txt` | **MISSING** | — | 0% |
| Sitemap | Present (dynamic, host-aware) | — | ✓ |

---

## 3. Critical Issues (block measurable SEO gains — fix first)

### 3.1 Sitemap base URL ≠ canonical domain — **CRITICAL**

`src/routes/sitemap[.]xml.ts` advertises `https://higaet.com` but no route file uses that domain in its `canonical`/`og:url`. The project's canonical domain per `project_urls` is `https://higaet-core-engine.lovable.app`, and `src/lib/site.ts` defaults `SITE.url` to `https://higaet.com` (no DNS confirmed).

**Impact:** Google sees sitemap URLs that 404 or redirect, then ignores the sitemap entirely. Indexation will stall regardless of other fixes.

**Fix:** Pick one canonical domain (recommend `higaet.com` once DNS is live; otherwise the Lovable canonical until then). Make sitemap, `SITE.url`, every leaf `canonical`, and every leaf `og:url` use the SAME origin.

### 3.2 No `public/robots.txt` — **CRITICAL**

The file does not exist. Crawlers fall back to "allow everything", which is OK for indexing but means:
- No `Sitemap:` hint → slower discovery for new pages.
- No way to block `_authenticated/*`, `/api/*`, `/auth/*`, `/dashboard/*` from being crawled even though they aren't useful in search.

**Fix:**
```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /auth/
Disallow: /dashboard/
Disallow: /admin/
Disallow: /assistant/

User-agent: GPTBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Google-Extended
Allow: /

Sitemap: https://<canonical-domain>/sitemap.xml
```

### 3.3 Sitewide `Organization` and `WebSite` JSON-LD use relative URLs — **CRITICAL**

`src/lib/site.ts`:
```js
ORG_JSONLD = { ..., url: "/", department: [{ url: "/academy" }, ...] }
WEBSITE_JSONLD = { ..., url: "/", potentialAction: { target: { urlTemplate: "/blog?q={search_term_string}" } } }
```

Schema.org requires **absolute URLs** for `url`, `sameAs`, and `SearchAction.target.urlTemplate`. Rich Results Test will reject these, and AI engines (ChatGPT, Perplexity, Gemini) that rely on JSON-LD for entity grounding will fail to attach HIGAET to its homepage.

**Fix:** Use absolute URLs from `SITE.url`. Add `logo`, `sameAs` (LinkedIn, Twitter/X, YouTube, GitHub, Wikipedia if any), `contactPoint`, and `address` to `Organization`.

### 3.4 Canonical coverage at 37% — **CRITICAL**

112 of 179 `head()`-bearing public routes have **no** `<link rel="canonical">`. TanStack Router does not auto-emit canonical. Google synthesizes one from URL, but variant URLs (trailing slash, query params, host alternates) cause duplicate-content suppression. AI Overviews specifically use canonical to deduplicate.

**Fix:** Add `links: [{ rel: "canonical", href: "<SITE.url><pathname>" }]` to every public leaf route's `head()`. Programmatic: write a `seoHead({ path, title, description, image?, type? })` helper in `src/lib/seo/head.ts` and call it everywhere — eliminates copy-paste drift.

### 3.5 `_authenticated` routes not marked `noindex` — **HIGH/CRITICAL**

~100 routes under `_authenticated.*` (dashboard, admin, CRM, assistant, community) have no `noindex`. They use `ssr: false`, so server returns a near-empty shell — but Google's modern crawler renders JS and **will** index the shell title/description from the root `head()`, polluting site search.

**Fix:** Add `{ name: "robots", content: "noindex, follow" }` to the `_authenticated` layout `head()` (single source). Verify it cascades; if not, repeat per leaf.

---

## 4. High-Priority Improvements

### 4.1 Add Organization signals for E-E-A-T + AI grounding
Extend `ORG_JSONLD`:
- `logo` (absolute URL, ≥112×112px)
- `sameAs` array — LinkedIn, X/Twitter, YouTube, GitHub, Crunchbase, Wikipedia (if any)
- `contactPoint` with `telephone`, `email`, `contactType: "customer service"`, `areaServed`, `availableLanguage`
- `address` (`PostalAddress` with `addressCountry`, `addressRegion`, `addressLocality`)
- `foundingDate`, `founders` (link to `/founder`)
- `numberOfEmployees`, `award`, `slogan`

This is the single highest-leverage AI-search change. ChatGPT, Perplexity, Gemini, and Claude all use `Organization` + `sameAs` to confirm entity identity before citing. Without it, HIGAET will be ranked below competitors that have it (upGrad, Scaler, Great Learning all do).

### 4.2 BreadcrumbList on every deep route
Currently on only ~7 routes. Add to every route 2+ levels deep:
- `/academy/programs/$slug`
- `/academy/campuses/$slug`
- `/global-education/countries/$slug`
- `/global-education/universities/$slug`
- `/global-education/knowledge-base/universities/$slug` (already present)
- `/blog/$slug`
- `/docs/$category/$slug`
- `/careers/$slug`, `/jobs/$slug`
- `/services/*`, `/industries/*`, `/case-studies/*`

Google shows breadcrumbs in SERPs; AI engines use them for hierarchical context.

### 4.3 Fix `SearchAction` target
`WEBSITE_JSONLD.potentialAction.target.urlTemplate` currently points at `/blog?q=` — too narrow. Either implement a real site-wide search at `/search?q=` and point there, or remove SearchAction (better than a misleading one).

### 4.4 Course schema on every Academy program
`src/lib/seo/course-schema.ts` is built but verify it's wired into `/academy/programs/$slug` and surfaces:
- `provider` (EducationalOrganization)
- `offers` with `price`, `priceCurrency`, `availability`
- `hasCourseInstance` with `courseMode`, `startDate`, `endDate`, `location`, `instructor`
- `educationalCredentialAwarded`
- `coursePrerequisites`, `timeRequired`, `inLanguage`

This unlocks Google's "Courses" SERP feature.

### 4.5 CollegeOrUniversity schema beyond `knowledge-base`
Currently only the `/knowledge-base/universities/$slug` route. Also add to `/global-education/universities/$slug` (different route). Plus add `Country` schema to `/global-education/countries/$slug`.

### 4.6 FAQ schema on FAQ pages
`/academy/faq`, `/global-education/faq`, and FAQ sections of pillar pages should emit `FAQPage` JSON-LD. The helper exists in `src/lib/seo/service-schema.ts` — wire it in.

### 4.7 Article schema on blog index missing dates
Blog post route `/blog/$slug` has Article schema. Verify it includes: `datePublished`, `dateModified`, `author` (`Person` with `url`), `publisher` (Organization with logo), `image` (absolute, ≥1200px), `mainEntityOfPage`.

### 4.8 og:image per pillar landing
Only 4 routes have `og:image`. Generate branded OG images for at least:
- `/` (home)
- `/higaet-academy`, `/higaet-global-education-hub`, `/higaet-technologies`, `/higaet-ai-platform`
- `/academy`, `/global-education`, `/technologies`
- Top 10 academy programs, top 10 universities, top 10 blog posts

Without `og:image`, every social/Slack/WhatsApp/LinkedIn share gets a textonly preview — measurable CTR loss.

---

## 5. Medium-Priority Improvements

| # | Item | Effort |
|---|---|---|
| 5.1 | Per-route `twitter:image` mirroring `og:image` | trivial when 4.8 lands |
| 5.2 | `<meta name="description">` audit — verify uniqueness across 189 routes; fix duplicates programmatically | 1 day |
| 5.3 | `<title>` audit — same as above; many pillar children may share the root title fallback | 1 day |
| 5.4 | Add `lang="en"` (already in `__root.tsx` shell — verify per-route override hook for future i18n) | trivial |
| 5.5 | `hreflang` placeholder for future India/UK/US targeting | defer |
| 5.6 | Preload LCP image per top route via `head().links` | 0.5 day |
| 5.7 | `loading="lazy"` audit on `<img>` below the fold; `decoding="async"` on all | 0.5 day |
| 5.8 | Article schema: add `wordCount`, `articleSection`, `keywords` for AI summarization | 0.5 day |
| 5.9 | Add `speakable` schema spec to FAQ + how-to pages (Google Assistant + AI voice answers) | 0.5 day |
| 5.10 | `Service` schema on every `/services/$slug` (the Technologies pillar) | 1 day |
| 5.11 | `ItemList` schema on every catalog page (`/academy/programs`, `/global-education/universities`, etc.) | 0.5 day |
| 5.12 | `VideoObject` schema if any pillar uses embedded video (faculty intros, campus tours) | conditional |
| 5.13 | Verify `manifest.webmanifest` declares correct theme color, icons (PWA-eligible) | 0.5 day |
| 5.14 | Validate every JSON-LD block with Google's Rich Results Test in CI | 1 day |
| 5.15 | Add internal-link audit (rg for broken `<Link to=...>` references vs `routeTree.gen.ts`) | 0.5 day |

---

## 6. Low-Priority Improvements

- `<link rel="alternate" type="application/rss+xml">` for `/blog`.
- `prev`/`next` on paginated catalog pages (if pagination is added).
- `meta name="generator" content="HIGAET Platform"` for press analytics.
- Per-route `theme-color` for divisional branding (Academy violet, Global Ed blue, Tech amber).
- Add `assignee` / `educator` Person schema for faculty pages.
- Replace generic `og:type: "website"` with `article` on blog/`docs`, `course` on programs.
- Add `dateModified` site-wide to every JSON-LD; AI engines weight freshness.

---

## 7. Technical SEO Checks

| Check | Status | Notes |
|---|---|---|
| Duplicate titles | **Likely present** | 124 routes inherit root title fallback. Run audit. |
| Duplicate descriptions | **Likely present** | Same root. |
| Missing canonicals | **CONFIRMED (112 routes)** | §3.4 |
| Broken internal links | **Unknown** | Run `rg "<Link to=" src/routes` vs `routeTree.gen.ts`. |
| Broken images | **Unknown** | Run Playwright + lighthouse-CI on top 20 routes. |
| Redirect chains | None observed in `src/server.ts` | OK |
| 404 handling | `NotFoundComponent` in root | OK — but it's a soft 404 (always 200 at the HTTP layer). Should return HTTP 404. **Fix:** set `Route.notFound` + return 404 in not-found server response. |
| Crawl depth | All routes ≤ 4 levels | OK |
| Indexability | Blocked by §3.1 sitemap mismatch | Critical |
| Pagination | Not currently used | N/A |
| Mobile friendliness | Tailwind + responsive primitives | Likely OK; verify with real Lighthouse |
| Core Web Vitals (LCP/CLS/INP) | **Not measured** | Run Lighthouse-CI; expect: LCP middling due to no image preload + Google Fonts blocking; CLS likely OK; INP may suffer in admin routes. |
| Image optimization | No `vite-imagetools` configured | Add AVIF/WebP build pipeline. |
| Lazy loading | Partial | Audit `<img>` for `loading="lazy"`. |
| JS rendering issues | SSR is correct; client hydration adds 200–400ms | Acceptable. |
| Google Fonts via `<link>` in root | OK | But blocks render — consider self-hosting Inter + Instrument Sans. |

---

## 8. AI Search / AEO / GEO Readiness

Audited for **ChatGPT (search + browse), Google AI Overviews (SGE), Perplexity, Claude, Gemini, You.com**.

| Signal | Status | Score impact |
|---|---|---|
| `llms.txt` present | ✓ | +10 |
| Entity coverage (Organization, founders, divisions) | Partial — missing `sameAs`, `logo`, `contactPoint` | −15 |
| Topical authority (depth in AI, Education, Study Abroad) | Strong | +10 |
| E-E-A-T signals (author bios, dates, credentials) | Partial — `Person` schema on `/portfolio/$slug`, missing on blog authors | −5 |
| Citation quality (clean URLs, stable slugs, low duplication) | Good — file-routed, type-safe | +5 |
| Semantic HTML (single H1, sectioning) | Spot-check OK; full audit needed | neutral |
| Content chunking (digestible sections, lists, tables) | Strong on Academy/Global Ed | +5 |
| AI-friendly headings (question-form, descriptive) | Partial — many headings are brand-y, not query-form | −5 |
| FAQ quality | FAQ pages exist but missing `FAQPage` schema | −5 |
| AI bot robots policy | None (default allow) | neutral, but explicit allow for GPTBot/ClaudeBot/PerplexityBot raises confidence |
| Structured Q&A blocks in long-form pages | Sparse | improvement opportunity |
| Author entity pages (`Person` schema) | Some (`/portfolio/$slug`, `people.ts`) | extend to blog authors and faculty |
| Date freshness (`dateModified`) | Missing on most JSON-LD | AI engines weight freshness; **add it** |

### What AI search engines need that HIGAET is missing

1. **A clear, machine-readable identity claim** — `Organization` JSON-LD with `sameAs` is THE primary cross-reference signal.
2. **Per-entity pages** — every program, university, faculty member, campus, case study should be its own URL with its own JSON-LD (most are; verify completeness).
3. **Question-form H2/H3 in long-form content** — "What is HIGAET Academy?", "How long does the visa process take?" These get extracted verbatim into AI answers.
4. **Dated, signed content** — author Person + `datePublished` + `dateModified` lets engines trust freshness.
5. **Cross-linking matrix** — every entity should link to ≥3 related entities (program → faculty → campus → success story). Builds the knowledge graph crawlers traverse.

---

## 9. Content Audit Highlights

| Area | Status | Gap |
|---|---|---|
| Homepage `/` | Strong copy, weak `og:image` | Add OG, add `Organization.logo` |
| Pillar landings (`/higaet-academy` etc.) | Good | Need OG images, `Service` or `EducationalOrganization` schema, FAQ block + schema |
| `/academy/programs` index | Good, has registry | Add `ItemList` JSON-LD |
| `/academy/programs/$slug` | Has Course helper | **Verify wired**, add `Offer`, `CourseInstance` |
| `/academy/blog/certifications-comparison` | Article schema present | Good |
| `/blog` index | Likely no schema | Add `Blog` JSON-LD |
| `/blog/$slug` | Article schema present | Add author Person, dateModified, image |
| `/global-education/countries/$slug` | Unknown schema | Add `Country` + FAQ schema |
| `/global-education/universities/$slug` | Different from KB route — confirm schema parity | Add `CollegeOrUniversity` |
| `/global-education/visa-guidance` | Likely no HowTo schema | Add `HowTo` JSON-LD |
| `/global-education/scholarships` | Likely no `EducationalOccupationalCredential` | Add schema |
| `/technologies/*` (services, industries, expertise, case-studies, insights) | Strong CollectionPage + Service schema | Add per-service `Service` schema with `offers`, `areaServed` |
| `/docs/*` | TechArticle + FAQPage | Strong |
| `/careers/$slug`, `/jobs/$slug` | JobPosting schema | Verify all required fields (datePosted, validThrough, hiringOrganization, jobLocation, baseSalary) |
| `/faculty`, `/leadership`, `/founder`, `/advisors` | Likely Person schema via `people.ts` | Verify each leaf has individual `Person` JSON-LD with `sameAs` to LinkedIn |

### Keyword gap (high-level, project-grounded)

Without running Semrush this round, the obvious gaps based on registry contents are:
- "AI engineering course India" — should rank `/academy/programs`
- "study abroad consultants India" — should rank `/global-education`
- "MS in AI USA universities" — should rank `/global-education/knowledge-base/universities`
- "data science certification placement" — should rank `/academy/placements`
- "enterprise AI consulting" — should rank `/technologies`
- "generative AI training" — should rank `/academy`

> **Heads-up:** Semrush data is available via the built-in tools. For paid-search visibility, multi-country tracking, or building an SEO dashboard inside the HIGAET admin, the **Semrush connector** would let me wire that into your app on your subscription. Say the word and I'll surface the right tool.

---

## 10. Prioritized Implementation Plan

| Phase | Item | Effort | Impact |
|---|---|---|---|
| **P0 — Week 1 (must)** | 3.1 Resolve domain mismatch (`SITE.url` = sitemap = canonicals) | 2h | Unblocks indexation |
| | 3.2 Create `public/robots.txt` with sitemap + AI bot allow-list | 30m | Faster discovery |
| | 3.3 Absolutize `Organization` + `WebSite` JSON-LD; add `logo`, `sameAs`, `contactPoint` | 2h | Entity grounding |
| | 3.4 `seoHead()` helper + canonical on all 112 missing routes | 1d | Dedup + ranking |
| | 3.5 `noindex` on `_authenticated` layout | 30m | Clean SERPs |
| **P1 — Week 2** | 4.2 BreadcrumbList on all deep routes (programs, universities, blog, docs, jobs) | 1d | SERP breadcrumbs |
| | 4.4 Verify Course schema wired to every academy program | 0.5d | Course rich results |
| | 4.5 CollegeOrUniversity on non-KB university route + Country on country pages | 0.5d | Entity graph |
| | 4.6 FAQPage on FAQ + service pages | 0.5d | FAQ rich results |
| | 4.7 Article schema completeness (author, dates, image) | 0.5d | Article rich results |
| | 4.8 OG images for top 25 routes (use imagegen) | 1d | Share CTR |
| **P2 — Week 3** | 5.2–5.3 Title/description uniqueness audit + fixes | 1d | Dedup |
| | 5.6 LCP preload per top route | 0.5d | LCP |
| | 5.8–5.10 Article enrichment, speakable, Service schema | 1d | AI extraction |
| | 5.11 ItemList on catalog pages | 0.5d | Carousel results |
| | 5.14 JSON-LD validation in CI | 1d | Drift prevention |
| **P3 — Week 4+** | All §6 polish + Lighthouse-CI in GitHub Actions + Semrush dashboard inside admin (if pursued) | 2–3d | Monitoring |

**Total P0+P1 effort:** ~6 engineer-days to move overall SEO score from 62 → projected **82+** in 30 days post-indexation.

---

## 11. Out of Scope (per request)

- No rendering strategy changes (Hybrid SSR retained — see prior `docs/audit/rendering-architecture-audit.md`).
- No framework migration.
- No content rewrites — only structural/semantic additions.
- No backend changes beyond `robots.txt` and `sitemap` corrections.

---

## 12. One-line summary

**Fix domain mismatch + robots.txt + absolute Organization JSON-LD + canonicals on every leaf + noindex on `_authenticated` first.** Those five items alone move the score from C+ to B+ within four weeks. Everything else is amplification.
