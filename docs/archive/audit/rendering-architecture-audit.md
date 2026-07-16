# HIGAET Rendering Architecture Audit (SPA vs SSR vs Hybrid)

**Status:** Read-only audit. No code changes performed.
**Date:** 2026-06-28
**Auditor:** Senior platform lens — SEO, EdTech, SaaS, performance, DX.

---

## 1. Executive Summary

HIGAET is **not** a CRA/Vite SPA. The codebase is already a **TanStack Start v1 (React 19) hybrid SSR application** bundled by Vite 7 and Nitro, currently being targeted at MilesWeb's Node.js runtime via the `node-server` preset and a Passenger shim (`app.js`).

- **305 route files** in `src/routes/` (189 public, ~116 under the `_authenticated` layout).
- **27+ server routes** under `src/routes/api/` (public webhooks, cron, AI, governance, health).
- **Server functions** (`createServerFn`) used pervasively across `src/lib/*.functions.ts` for typed RPC.
- **File-based routing** with dot-naming, fully type-safe, generated `routeTree.gen.ts`.
- **SSR is real**: `src/server.ts` is the wrapped Nitro entry with security headers, correlation IDs, h3 error normalization, and structured request logging.
- **Authentication**: client-gated `_authenticated` layout (`ssr: false`) — Supabase session lives in `localStorage`, so the protected tree is effectively a SPA shell.

**Verdict:** The current architecture is the right one for HIGAET. **Keep Hybrid SSR (TanStack Start, Node target).** Do NOT migrate to Next.js, Pure SPA, or React Router DOM. The required improvements are tactical — route-level SSR opt-outs, head-tag hygiene, lazy-loading admin bundles, and stronger SSG/ISR for marketing content — not a framework change.

---

## 2. Current Architecture (As-Is)

| Layer | Implementation | Notes |
|---|---|---|
| Framework | TanStack Start v1 + React 19 | SSR-ready, file-routed |
| Build | Vite 7 + Nitro | `BUILD_TARGET=node` → `node-server` preset; default → Cloudflare Workers |
| Routing | File-based, type-safe | `src/routes/`, generated `routeTree.gen.ts` |
| API (internal) | `createServerFn` (RPC) | `src/lib/*.functions.ts`, ~60+ server functions |
| API (external) | TSS server routes | `src/routes/api/public/*` bypasses auth; HMAC-verified webhooks |
| Auth | Supabase (Lovable Cloud) | `_authenticated` layout uses `ssr: false` + `beforeLoad` redirect |
| DB | Postgres (Supabase) | 47+ migrations, RLS enforced, GRANTs in place |
| AI | Lovable AI Gateway + Brevo (emails) | Server-only `.handler()` reads `process.env` |
| Hosting (current) | MilesWeb cPanel + Phusion Passenger | `app.js` boots `.output/server/index.mjs` |
| Hosting (preview) | Lovable / Cloudflare Workers | Default Vite build target |
| Observability | Structured JSON logs + correlation IDs + Reliability Ops dashboard | `src/server.ts` |

### Rendering strategy today (de facto)

- **Marketing/content routes** (Academy, Global Education, Technologies, Blog, Docs, About, Pricing-equivalents): **SSR by default**, with per-route `head()` for SEO. Most do **not** declare loaders, so they SSR the rendered React tree but skip data fetching server-side.
- **`_authenticated/*` (Dashboard, Admin, CRM, AI Assistant)**: explicitly `ssr: false`. Rendered as SPA after client hydration + Supabase session check.
- **AI Hub `/ai/*`**: SSR shell + client-side data via TanStack Query.
- **`/api/public/*`**: server routes — never rendered.

### What's working

- File-based routing scales cleanly to 305 routes without manifest churn.
- `createServerFn` boundaries correctly isolate secrets — verified by audit.
- `src/server.ts` ships a production-grade wrapper: security headers, HSTS in prod, correlation IDs, structured logs, h3 error normalization, request-failure capture.
- Public webhook surface (`/api/public/*`) is HMAC-verified per pattern.

### Bottlenecks & risks

1. **Admin/CRM bundle bloat.** ~116 `_authenticated` routes ship into one client bundle on first protected navigation. Recharts, lucide-react, large form libs, and PDF/markdown deps land in the admin chunk.
2. **Hydration cost on marketing pages.** Pages render server-side but rehydrate the full client runtime (TanStack Router + Query). For purely static content (Pricing, About, Contact) this is wasted work.
3. **No ISR / no cache layer.** Every SSR request rebuilds the HTML — Cloudflare/MilesWeb don't have a built-in HTML cache configured. High-traffic marketing pages will pay full SSR cost per request.
4. **`og:image` coverage is partial.** Spot-check shows most leaf routes set `title`/`description` but few have route-specific `og:image`, hurting share previews.
5. **`canonical` not consistently set per leaf** — `head-meta` rules say leaf-only canonical; not all 189 public routes comply.
6. **Bundle reporting disabled** (`reportCompressedSize: false`) — required to fix the build memory crash, but means we don't know current chunk sizes without a manual `vite build --report`.
7. **`_authenticated` SPA shell waits for client-side `supabase.auth.getUser()`** before rendering — produces a visible blank flash on slow networks.

---

## 3. Architecture Recommendation

**Recommendation: KEEP TanStack Start Hybrid (SSR + SPA islands). Do not migrate.**

### Why not the alternatives

| Option | Verdict | Reason |
|---|---|---|
| Pure SPA (Vite + React Router) | Reject | Loses SEO on 189 public marketing routes; HIGAET's ranking strategy depends on indexable Academy/Global Ed pages. |
| Pure SSR (every route server-rendered) | Reject | Wasted compute for admin/CRM where SEO is irrelevant and interactivity dominates. |
| Pure SSG | Reject | Dynamic content (courses, universities, AI Assistant, payments) is too volatile; rebuild times would block iteration. |
| ISR-only | Reject | TanStack Start doesn't ship ISR natively; bolting it on isn't worth the rewrite. |
| Next.js App Router | Reject | Migrating 305 routes, server fns, RLS-aware Supabase patterns, and the existing CI/deploy pipeline is months of work for no user-visible win. Next.js on MilesWeb cPanel/Passenger is poorly supported vs Nitro's `node-server` preset already working. |
| React Router DOM | Reject | Strict downgrade — loses SSR, loses type-safe routing, loses server fns. |

### Why Hybrid SSR is correct for HIGAET

- **SEO**: Marketing/Academy/Global Ed/Tech pillar pages SSR cleanly with per-route `head()`.
- **Performance**: Admin shell opts out of SSR to skip wasted hydration; data fetched client-side with TanStack Query.
- **AI workflows**: Server fns + `/api/public/*` cron handle streaming, embeddings, webhook dispatch.
- **CRM/Dashboard responsiveness**: SPA-mode `_authenticated` tree means instant client navigation after first load.
- **Scalability**: Nitro presets give us Node, Cloudflare, Bun, Deno — same code, multiple deploy targets.
- **MilesWeb compatibility**: Already validated. `app.js` + `.output/server/index.mjs` boots under Passenger.
- **Maintenance**: One framework, one router, one bundler — no Next/Remix migration tax.

---

## 4. Route-by-Route Rendering Strategy

Full route table is too long for one document; here is the **policy by route group** plus a representative sample. Apply the policy across every route in the group.

### Policy matrix

| Group | Routes | Current | Recommended | Reason |
|---|---|---|---|---|
| Homepage & top-level marketing | `/`, `/about-higaet`, `/about`, `/contact`, `/leadership`, `/founder`, `/advisors`, `/faculty`, `/governance`, `/constitution*`, `/kernel` | SSR | **SSR + edge cache (5–15 min)** | SEO-critical, content changes infrequently. |
| Pillar landing pages | `/higaet-academy`, `/higaet-global-education-hub`, `/higaet-technologies`, `/higaet-ai-platform` | SSR | **SSR + edge cache (5 min)** | Top funnel pages; need fast TTFB + indexability. |
| Academy content | `/academy/*` (programs, campuses, certifications, learning-paths, success-stories, blog) | SSR | **SSR for `$slug` (dynamic), SSG-style cached SSR for index pages** | Course content updates weekly; ISR-like cache is sufficient. |
| Global Education content | `/global-education/*` (countries, universities, scholarships, visa) | SSR | **SSR + cache (15 min)** for `$slug`; cache (1 hr) for index | University data is reference; long cache wins. |
| Technologies/Services | `/services/*`, `/industries/*`, `/insights/*`, `/case-studies/*` | SSR | **SSR + cache (1 hr)** | Slow-changing B2B content. |
| Blog | `/blog`, `/blog/$slug` | SSR | **SSR + cache (10 min)** with revalidate-on-publish | Dynamic but content is stable post-publish. |
| Docs | `/docs/*` | SSR | **SSR + cache (1 hr)** | Reference docs. |
| Jobs / Careers | `/jobs/*`, `/careers/*` | SSR | **SSR + short cache (2 min)** | Listings change; freshness matters. |
| Auth | `/auth/login`, `/auth/register`, `/auth/forgot-password` | SSR | **SSR (no cache)** | Forms; must not cache per-user state. |
| Error / Utility | `/403`, `/not-found`, `/cookies` | SSR | **SSG (build-time)** | Static. |
| AI Hub shell | `/ai`, `/ai/chat`, `/ai/history`, `/ai/collections`, `/ai/prompts` | SSR shell + client data | **Keep as-is (SSR shell, client data via TanStack Query)** | Hybrid is optimal. |
| AI Collection detail | `/ai/collections/$slug` | SSR | **SSR + cache (10 min)** | Public knowledge, indexable. |
| Authenticated dashboard | `/_authenticated/dashboard/*` (~30 routes) | SPA (`ssr:false`) | **Keep SPA** + lazy-load per section | No SEO need; interactivity-first. |
| Authenticated admin | `/_authenticated/dashboard/admin/*` (~50 routes) | SPA | **Keep SPA** + aggressive route-level code-splitting | Heavy charts/tables; should not block public bundles. |
| Authenticated CRM | `/_authenticated/dashboard/admin/crm/*` | SPA | **Keep SPA**, split per `$type` | Already dynamic; chunk per entity type. |
| Authenticated Community | `/_authenticated/community/*` | SPA | **Promote shell to SSR for `$slug` index** (public-readable threads) | Currently locked behind auth; if any thread is meant to be public/shareable, SSR enables link previews. *Confirm with product.* |
| Authenticated AI Assistant | `/_authenticated/assistant/*` | SPA | **Keep SPA** | Real-time, per-user, no SEO. |
| Payments (user) | `/_authenticated/dashboard/payments/*` | SPA | **Keep SPA (no cache)** | Per-user financial state. |
| Payments admin | `/_authenticated/dashboard/admin/payments` | SPA | **Keep SPA** | Queue UI. |
| Settings | `/_authenticated/dashboard/settings/*` | SPA | **Keep SPA** | Per-user. |
| Server routes | `/api/public/*`, `/api/chat`, `/api/v1/*` | Server | **Keep server** | Not rendered. |

### Sample explicit table (requested examples mapped to HIGAET routes)

| Route | Current | Recommended | Reason |
|---|---|---|---|
| `/` | SSR | SSR + edge cache 5 min | Homepage SEO. |
| Pricing → `/academy/programs`, `/global-education/scholarships` | SSR | SSR + cache 15 min | Indexable funnels. |
| Features → `/higaet-ai-platform`, pillar pages | SSR | SSR + cache 10 min | Conversion + SEO. |
| `/blog` | SSR | SSR + cache 10 min | Dynamic but cacheable. |
| `/about-higaet`, `/about` | SSR | SSR + cache 1 hr or SSG | Rarely changes. |
| `/contact`, `/academy/contact`, `/global-education/contact` | SSR | SSR (no cache) | Has form, no per-user data. |
| `/auth/login`, `/auth/register` | SSR | SSR (no cache) | Forms. |
| `/_authenticated/dashboard` | SPA | SPA | Per-user. |
| CRM `/_authenticated/dashboard/admin/crm/*` | SPA | SPA + per-entity chunk | Heavy. |
| AI Assistant `/_authenticated/assistant/*` | SPA | SPA | Realtime chat. |
| Admin `/_authenticated/dashboard/admin/*` | SPA | SPA + lazy chunks | Bundle bloat risk. |
| Analytics `/_authenticated/dashboard/admin/analytics` | SPA | SPA + lazy Recharts | Charts are heavy. |
| Settings `/_authenticated/dashboard/settings/*` | SPA | SPA | Per-user. |
| Lead Mgmt `/_authenticated/dashboard/admin/sa-leads`, `tech-leads` | SPA | SPA | Per-user. |
| Knowledge Base `/global-education/knowledge-base/universities/*` | SSR | SSR + cache 1 hr | Reference data. |
| Billing `/_authenticated/dashboard/payments/*` | SPA | SPA (no cache) | Financial. |

---

## 5. Performance Audit

### Heavy bundles (suspected — confirm with `vite build --mode production --report`)

- **Recharts** in admin analytics + reliability ops dashboard → ~90 KB gzip. Lazy-load per route.
- **lucide-react** — fine if tree-shaken; verify named imports only.
- **shadcn/ui** primitives — many are imported across both public and admin trees; verify chunk boundary.
- **`@tanstack/react-query` devtools** — confirm NOT in prod bundle.
- **`pdf-lib` / `xlsx` / `markitdown`** (if used in admin export flows) — must be dynamic-imported.
- **AI chat window** (`src/components/ai/ChatWindow.tsx`) — large; should be split from the `_authenticated/assistant` shell.

### Lazy-load candidates

- All `_authenticated/dashboard/admin/*` route components (TanStack Router supports `lazy()` per file route via `createLazyFileRoute`).
- `ChatWindow`, `AiTutor`, observability dashboards.
- Rich text editors, code editors, charts, PDF viewers (anywhere they appear).
- `NotificationBell` realtime subscriptions — gate behind hydration.

### Code-splitting candidates

- Split client bundle by **public marketing** vs **`_authenticated` shell** — verify chunk graph after enabling `reportCompressedSize` for one diagnostic build.
- Split CRM by entity type (`$type` route param) so loading "Leads" doesn't pull "Visa applications" code.

### Image optimization

- Repo doesn't show `vite-imagetools` configured. Recommend adding for build-time AVIF/WebP variants on all `src/assets/*` images.
- Public images in `/public/` are served as-is — no responsive `srcset`.
- LCP image per page should be preloaded via `head().links`.

### Server Components candidates

- TanStack Start does not have React Server Components. Equivalent: move data fetching into route `loader`s (server-side) and keep pure presentational components.

### Client Components candidates (i.e. keep client-only)

- Interactive widgets: `CopyButton`, `ChatWindow`, `NotificationBell`, `PaymentStatusTimeline`, `SkillsInput`, form components.

---

## 6. SEO Audit

| Check | Status | Notes |
|---|---|---|
| `<title>` per route | Partial | `head-meta` knowledge enforced; spot-check shows most leaf routes comply. Audit all 189 public routes for unique titles. |
| Meta description | Partial | Same — leaf coverage is incomplete. |
| Open Graph (`og:title`, `og:description`, `og:type`, `og:url`) | Partial | `og:url` should self-reference each leaf; verify. |
| `og:image` per leaf | **Gap** | Few routes set it. Highest ROI: generate one per pillar landing + per top blog post + per program slug. |
| Twitter card | Partial | Mirror `og:image` decisions. |
| Canonical (leaf-only) | **Gap** | `head-meta` rule says leaf-only canonical to avoid the root concat bug. Verify no canonical in `__root.tsx`. |
| Sitemap | Present | Dynamic `src/routes/sitemap[.]xml.ts` (per repo structure). Verify it covers all dynamic slugs (academy programs, universities, blog posts). |
| `robots.txt` | Present | `public/llms.txt` and `public/manifest.webmanifest` present; verify `robots.txt` allows public crawling and references sitemap. |
| JSON-LD | Present per ADR | `src/lib/jsonld.ts` exists. Verify: Organization (sitewide), Article (blog), Course (academy programs), CollegeOrUniversity (global-ed universities), FAQPage (faq routes), BreadcrumbList (deep routes). |
| Dynamic metadata from loader data | Mixed | Many routes pull from in-code registries (`src/content/*`), which is fine — head() can read registry synchronously. |
| AI-generated landing pages | None today | If/when added, must SSR with full head() — do not generate at client. |
| `noindex` on `_authenticated` | **Verify** | All `/dashboard/*`, `/admin/*`, `/assistant/*` should emit `<meta name="robots" content="noindex">`. |
| `noindex` on auth pages | **Verify** | `/auth/login`, `/auth/register` should be `noindex`. |
| hreflang | Not implemented | If multi-language is roadmap, add later. |
| Structured data tested | Unknown | Run Google Rich Results test on top 10 routes. |

### SEO action list (prioritized)

1. **Generate `og:image` for top 25 routes** (pillars + top 10 programs + top 10 universities + top blog posts). Use the `imagegen` tool with branded templates.
2. **Audit canonical + `og:url`** — script `rg "canonical" src/routes/**/*.tsx` and verify leaf-only + self-referencing.
3. **Add `noindex` to all `_authenticated` and `/auth/*` routes** in their `head()`.
4. **Verify sitemap covers dynamic slugs** — list every `$slug` route and confirm sitemap loader fetches all rows.
5. **JSON-LD coverage** — add `Course` schema to academy programs, `CollegeOrUniversity` to global-ed university pages.
6. **Run a full SEO scan** (use `seo_chat--trigger_scan`) after the above.

---

## 7. Deployment Compatibility

**MilesWeb Node.js (cPanel + Passenger): ✅ Compatible — already wired.**

- `BUILD_TARGET=node bun run build:node` → emits `.output/server/index.mjs` via Nitro's `node-server` preset.
- `app.js` is the Passenger shim — boots Nitro, loads `.env`, logs diagnostics, handles uncaught exceptions.
- GitHub Actions workflow (`deploy-milesweb-staging.yml`) handles build → SCP → atomic symlink swap → Passenger restart → smoke test, with preflight + verification gates at every stage.
- Node 20.x runtime confirmed.
- `process.env` reads happen inside `.handler()` bodies (server-only boundary).
- No Node-incompatible packages used at SSR runtime (no Sharp on hot path, no child_process, no native bindings).

### Changes required if recommendation accepted

**None for the framework.** The architecture decisions above are tactical optimizations within the existing setup. Specifically:

- Edge caching is achievable via Cloudflare in front of MilesWeb (recommended) OR `Cache-Control` headers from `src/server.ts` per route group (cheap, immediate).
- ISR-style behavior can be approximated with stale-while-revalidate `Cache-Control` headers — no framework migration needed.
- Per-route SSR opt-out is already supported (`ssr: false` on a route file).

---

## 8. Migration Roadmap

**No framework migration recommended.** The "migration" is a series of tactical hardenings.

### Phase 1 — SEO hygiene (1–2 days, low risk)

- Audit & fix `canonical` + `og:url` on all 189 public routes.
- Add `noindex` to `_authenticated` and `/auth/*`.
- Verify sitemap covers all dynamic slugs.
- Add `Course` / `CollegeOrUniversity` / `Article` JSON-LD where missing.

**Benefit:** measurable SEO uplift in 30–60 days.
**Risk:** zero. Metadata-only edits.

### Phase 2 — Edge caching for marketing (1 day)

- Add `Cache-Control` headers in `src/server.ts` per route group (regex match on URL path).
- Stale-while-revalidate values per the matrix in §4.

**Benefit:** P50 TTFB drops 60–80% for cached pages; reduces MilesWeb CPU load.
**Risk:** low. Must exclude authenticated and form routes from cache.

### Phase 3 — Bundle splitting (2–3 days)

- Convert all `_authenticated/dashboard/admin/*` route files to `createLazyFileRoute` where appropriate.
- Dynamic-import Recharts, ChatWindow, PDF/Excel helpers.
- Run `vite build --report` to verify chunk sizes; document the budget.

**Benefit:** smaller public bundle → faster TTI on marketing pages; faster admin first-load.
**Risk:** medium. Lazy boundaries must not break route preloading or type-safety. Test with Playwright.

### Phase 4 — Image pipeline (1 day)

- Add `vite-imagetools` for build-time AVIF/WebP.
- Preload LCP image per top route via `head().links`.

**Benefit:** LCP improvement on marketing pages.
**Risk:** low.

### Phase 5 — Optional: Cloudflare in front of MilesWeb (0.5 day ops)

- Point DNS through Cloudflare; configure cache rules + WAF.

**Benefit:** Global edge caching, DDoS protection, free TLS.
**Risk:** low. Reversible.

### Total effort

**6–8 engineer-days** to land all five phases. No breaking changes. No framework swap. No user-facing downtime.

---

## 9. Final Recommendation

**KEEP the current TanStack Start hybrid SSR architecture. Reject migration to Next.js, Pure SPA, React Router DOM, or Pure SSG.**

The architecture already matches HIGAET's needs: SEO-critical content SSRs, authenticated app shells run as SPA islands, server functions handle typed RPC with secrets, and `/api/public/*` exposes webhook/cron surfaces. MilesWeb deployment is wired and tested.

The real work is **tactical**: SEO completeness, edge caching for marketing, bundle splitting for admin, image pipeline, and (optionally) Cloudflare in front. Total cost: ~6–8 days, zero framework risk, immediate measurable wins on Core Web Vitals and indexability.

A migration to Next.js or any other framework would consume months, break the Supabase/RLS integration patterns, throw away the working CI/CD + Passenger pipeline, and deliver no user-visible benefit. Do not do it.

---

## Appendix A — Route inventory counts

- Total route files: **305**
- Public routes (SSR): **189**
- Authenticated routes (SPA via `_authenticated` layout): **~116**
- Server routes (`/api/*`): **27+**
- Server functions (`createServerFn`): **60+** across `src/lib/*.functions.ts`

## Appendix B — Files to read next (for implementation phases)

- `src/server.ts` — for Phase 2 cache headers.
- `src/routes/__root.tsx` — for sitewide head defaults and ensuring no canonical leak.
- `src/routes/sitemap[.]xml.ts` — for Phase 1 dynamic slug coverage.
- `src/lib/jsonld.ts` — for Phase 1 schema additions.
- `vite.config.ts` — for Phase 4 imagetools + bundle reporting.
- Any `_authenticated.dashboard.admin.*.tsx` — for Phase 3 lazy conversion targets.
