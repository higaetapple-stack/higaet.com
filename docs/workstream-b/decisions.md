# Workstream B — Decision Log

**Date:** 2026-06-14
**Status:** Approved. Binding for all B.x steps.

These four decisions resolve the open issues raised in `audit.md §4` and govern the rest of Workstream B.

---

## D-B-1 — Path strategy: URL resolver, not route-aware generators

**Decision.** Keep the breadcrumb / sitemap generators generic. Introduce a
small **URL resolver** in the provider layer that maps registry entities
(category / course / learning-path) to their current live route URL.

**Rationale.** Generators must stay route-agnostic. Routing is consumer
concern; if URLs change later (`/academy/{slug}` → `/academy/categories/{slug}`),
only the resolver changes — registries and generators stay frozen.

**Allowed under the freeze?** Yes. Adding a new provider-layer export
is additive; no contract or signature change.

**Flow:**
```text
Registry → URL Resolver → Breadcrumb / Sitemap consumers
```

**Implementation.** `src/content/providers/academy-urls.ts` exporting
`academyCategoryUrl`, `academyCourseUrl`, `academyLearningPathUrl`,
`academyHomeUrl`. Re-exported from `@/content/providers`. B.6 wires
breadcrumb rendering through the resolver instead of consuming the
generated `path` field directly.

---

## D-B-2 — `PROGRAMS` / `CAMPUSES` excluded from Workstream B

**Decision.** Out of scope. They model a richer domain (curriculum, fees,
faculty, hiring partners, FAQs, campuses) than Registry v1.0 contracts.
Log under **Academy Registry v1.1** for future version governance.

**Rationale.** Avoid premature abstraction. Forcing them into v1.0 would
require breaking changes to frozen contracts.

---

## D-B-3 — Homepage "Learning Paths" block → `LEARNER_AUDIENCES`

**Decision.** Rename local constant to `LEARNER_AUDIENCES` and keep inline.
It models learner segments (school, professional, entrepreneur), not the
role-based learning paths the registry owns.

**Rationale.** Marketing copy ≠ registry data. If learner-audience pages
ever become first-class, they belong in a future Marketing/Content registry.

---

## D-B-4 — Mega menu scope: Programs branch only

**Decision.** Migrate only the Programs branch to
`getAcademyCategories({ filter: { visibility: "public" } })`. Resources
and Campuses remain inline (out-of-scope domains).

**Rationale.** Don't registry-ify what the registry doesn't own.

---

## Sequencing impact

- B.2 (homepage) proceeds with `LEARNER_AUDIENCES` rename only — no
  inline → registry swap for that block.
- B.3 (mega menu) scoped to Programs branch.
- B.6 (breadcrumbs) blocks on URL resolver landing first.

---

## Substep log

### B.2 · Step 1 — AcademyMegaMenu — **Intentional no-op**

`AcademyMegaMenu.tsx` is NOT modified during v1.4.

Rationale (approved):

- `PROGRAMS` (Programs panel) is curriculum-domain data — out of scope
  per D-B-2 (Registry v1.1).
- `CAMPUSES` (Campuses panel) is out of scope per D-B-2.
- `RESOURCES` is marketing nav — not modeled by Registry v1.0.
- Top-row routes use typed TanStack `<Link to="…">` literals; replacing
  with resolver strings would reduce type safety with zero behavior win.

Forcing a migration here would either change the UI, reduce type safety,
or introduce an unnecessary abstraction — all violations of v1.4
release principles. Current inline structures remain authoritative
until Registry v1.1 expands to cover them.

### B.2 · Step 2 — AcademySearch — **Migrated (additive)**

- New provider-backed groups in the command palette: `Academy · Pillars`,
  `Academy · Courses`, `Academy · Learning Paths` — sourced from
  `getAcademySearchIndex()`.
- URLs derived via the Academy URL resolver (`academyCategoryUrl`,
  `academyCourseUrl`, `academyLearningPathUrl`) so live routes stay
  correct independent of generator output (ADR-0003).
- `PROGRAMS` and `CAMPUSES` groups preserved verbatim (out of scope).
- Keyboard shortcuts (`/`, `⌘K`), analytics events
  (`academy_search_open`, `academy_search_query`,
  `academy_search_result_click`), accessibility, and dialog UI
  unchanged.
- Added `SearchRecord`, `BreadcrumbEntry`, `SitemapEntry` type re-exports
  from `@/content/providers` (additive — allowed under freeze).

