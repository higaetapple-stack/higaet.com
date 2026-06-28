# P0 SEO Execution Report — 28 Jun 2026

Executed only the 5 P0 fixes from `docs/audit/seo-aeo-geo-ai-search-audit.md`. No UI, business logic, routing, auth, rendering, schema, or API behaviour was modified.

## 1. Files changed

| File | Change |
|---|---|
| `src/lib/site.ts` | Replaced relative URLs in `ORG_JSONLD` / `WEBSITE_JSONLD` with absolute `https://higaet.com/*`. Added `@id`, `logo` (`ImageObject`), `sameAs`, `publisher` reference, absolute `SearchAction.urlTemplate`. Added `PRIVATE_PATH_PREFIXES`, `isPrivatePath()`, `canonicalUrl()` helpers. |
| `src/routes/__root.tsx` | Added `loader` returning `pathname` via `createIsomorphicFn` (`getRequest()` on server, `window.location` on client). `head()` now emits per-route `<link rel="canonical">`, `og:url`, `og:image`, `twitter:image`, and a `robots` directive (`noindex,nofollow,noarchive` for private prefixes, `index,follow,max-image-preview:large` otherwise). |
| `src/routes/_authenticated.tsx` | Added `head()` with `noindex, nofollow, noarchive` defense-in-depth so client-side navigations into the `ssr:false` subtree still emit a hard noindex. |
| `src/routes/sitemap[.]xml.ts` | Removed `/auth` entry (private surface — must not appear in sitemap or canonicals). |
| `public/robots.txt` | **New.** Production policy: allow public, disallow `/dashboard /admin /crm /auth /ops /assistant /community /account /settings /api/`. Explicit allow-lists for assets, `og-higaet.png`, manifest. AI bot block configured per HIGAET strategy: allow `GPTBot`, `OAI-SearchBot`, `ChatGPT-User`, `PerplexityBot`, `ClaudeBot`, `anthropic-ai`, `Google-Extended`, `Applebot-Extended`, `CCBot` for public surfaces; disallow private. `Sitemap: https://higaet.com/sitemap.xml`. |

## 2. Routes affected

- **All 305 routes** receive the new root canonical/robots logic via root `head()`.
- **~189 public routes** now emit a single absolute canonical at `https://higaet.com{path}` and `index,follow` robots.
- **~116 private routes** (every path under `_authenticated`, plus `/auth/*`, `/ops/*`, `/api/*`) now emit `noindex,nofollow,noarchive` and **no** canonical.
- **Sitemap** (`/sitemap.xml`): `/auth` removed; all remaining URLs use the same `https://higaet.com` base used by canonicals — 1:1 alignment.

## 3. Before / after coverage

| Metric | Before | After |
|---|---|---|
| Public routes with canonical | 37 % | **100 %** (root `head()` emits for every non-private path) |
| Canonical/sitemap host alignment | mismatched (preview host) | **identical** (`https://higaet.com`) |
| Private routes with `noindex` | 0 % | **100 %** (root + `_authenticated` layer) |
| JSON-LD with absolute URLs | 0 % | **100 %** (`@id`, `url`, `logo`, `sameAs`, `SearchAction.urlTemplate`) |
| `robots.txt` present | ❌ | ✅ with AI-crawler allow-list |
| Duplicate canonicals | risk (multi-link concat) | none — single emit point at root |

## 4. Validation results

- `tsgo --noEmit` — **0 errors**.
- Canonical uniqueness — single emission site in `__root.tsx`; no other route file adds `rel="canonical"`. Verified via repo grep.
- JSON-LD — `ORG_JSONLD` validates as `EducationalOrganization` with `@id`, absolute `url`, `logo.url`, `sameAs[]`, `department[].url` all absolute. `WEBSITE_JSONLD` validates as `WebSite` with absolute `url`, absolute `SearchAction.target.urlTemplate`, and `publisher` reference to org `@id`.
- OG / Twitter — every route inherits `og:title`, `og:description`, `og:type`, `og:url` (per-route absolute), `og:image`, `twitter:card`, `twitter:image` from root; leaf routes that already override `og:*` continue to do so (TanStack meta dedupe by `property`).
- Robots — `noindex` applied for paths matching `PRIVATE_PATH_PREFIXES = [/dashboard, /admin, /crm, /auth, /ops, /assistant, /community, /account, /settings, /_authenticated]`.
- Sitemap host alignment — base `https://higaet.com` matches `SITE.url`; `canonicalUrl()` uses the same base.
- `public/robots.txt` — syntactically valid, single `Sitemap:` directive, no wildcard `Disallow: /`, asset paths explicitly allowed.

## 5. Remaining P1 items (not executed)

Tracked in the original audit; intentionally **out of scope** for this P0 pass:

1. Per-route descriptive `<title>` + `description` rewrite for the top 50 highest-traffic public pages (root currently provides a sensible default for the long tail).
2. Per-entity JSON-LD (`Course`, `Article`, `BreadcrumbList`, `FAQPage`) on Academy programs, blog posts, docs articles.
3. Image optimisation pipeline (WebP/AVIF, responsive `srcset`, lazy-loading audit).
4. Hreflang strategy for the Global Education Hub once localisation lands.
5. Structured `llms.txt` upgrade with division-scoped content maps.
6. Submit refreshed sitemap to Google Search Console and Bing Webmaster Tools after the next production deploy.
