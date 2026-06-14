# Workstream B — Academy Consumer Migration (v1)

**Objective.** Migrate every Academy consumer (routes, mega menu, search, breadcrumbs, metadata, JSON-LD) from inline literals to the frozen `@/content/providers` layer.

**Non-objective.** No new features. No layout changes. No new copy. The visual surface must be byte-for-byte equivalent before and after each step.

```text
Old:  UI  →  inline literals
New:  UI  →  @/content/providers  →  Academy Registry v1.0 (frozen)
```

---

## Guardrails (apply to every step)

1. Imports from Academy data come ONLY from `@/content/providers`. ESLint already blocks direct registry imports.
2. No changes to `src/content/_registry/`, `src/content/providers/`, or `src/content/academy/` — those are frozen (see `src/content/ADR-FREEZE.md`).
3. No visual regressions: each step is verified against the live preview before approval.
4. Each step is additive and independently revertible.
5. If provider data doesn't yet cover a UI need, STOP and propose a registry change under version governance — never re-introduce inline data.

---

## B.1 — Route & Consumer Audit (deliverable only)

Produce a migration matrix listing every Academy file that contains:

- Inline category / course / learning-path / testimonial arrays.
- Hardcoded breadcrumb trails.
- Static `head()` titles/descriptions for Academy routes.
- Hand-maintained search entries for Academy content.
- Duplicated mega-menu navigation arrays.

Output: a markdown file at `docs/workstream-b/audit.md` with columns `file · symbol · kind · target provider call · risk`. No code changes.

## B.2 — Homepage Migration (`/academy`)

Replace inline literals on the Academy landing page with `getAcademyCategories`, `getAcademyLearningPaths`, `getAcademyTestimonials`. Layout, ordering, and copy unchanged.

## B.3 — Mega Menu Migration

Academy mega menu consumes `getAcademyCategories({ filter: { visibility: "public" } })`. Sort by the registry's `order` field. Icons resolved at render time from the category's `icon` string.

## B.4 — Search Migration

Academy search (command palette / search input) consumes `getAcademySearchIndex()`. Remove any hand-maintained Academy search list.

## B.5 — Route Metadata + JSON-LD

For every Academy route, derive `title`, `description`, `canonical`, OG/Twitter tags, and JSON-LD (`CollectionPage`, `Course`, `BreadcrumbList`, `Review`) from provider data:

- Course detail: `resolveCourseBySlug` → `metadata` + JSON-LD `Course`.
- Category detail: `resolveCategoryById` (via slug lookup) → `metadata` + `CollectionPage`.
- Learning path detail: `resolvePathByIdOrSlug` → `metadata` + composed `Course` references.

## B.6 — Breadcrumb Migration

Replace every hardcoded breadcrumb tree with `getAcademyBreadcrumbs(currentPath)`. Render the returned `BreadcrumbEntry[]` in the existing breadcrumb component.

## B.7 — QA

- Visual parity check against the frozen baseline (spot-check every Academy route on mobile + desktop).
- `rg` sweep for any remaining inline Academy data outside `src/content/academy/`.
- TypeScript clean, ESLint clean, registry tests green, build succeeds.
- Manual click-through of every migrated route.

## B.8 — Consumer Freeze

Add `src/content/ADR-FREEZE-consumers.md` documenting the consumer baseline:

- Frozen consumer files and the provider calls they depend on.
- Rule: future Academy UI work consumes providers; it does not reintroduce inline data.

---

## Acceptance Criteria

- Zero inline Academy data outside `src/content/academy/`.
- All Academy pages consume providers.
- Mega menu, search, breadcrumbs, metadata, and JSON-LD all sourced from providers.
- No visual regressions.
- TypeScript / ESLint / tests / build all clean.

---

## Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| Provider data missing a field a current page renders | Surface as an audit-matrix gap in B.1; resolve through version governance, not inline data. |
| Slug / URL drift between inline data and registry | B.1 audit explicitly compares slugs; B.6 covers redirect plan if any diverge. |
| Component prop shape doesn't match registry shape | Use small adapter functions at the consumer boundary; never mutate registry types. |
| Hidden visual regressions | Per-step preview QA before moving to the next step. |

---

## Sequencing

B.1 (audit) is a prerequisite for every other step. B.2–B.6 are independent and can be approved/merged individually. B.7 runs after all migration steps. B.8 closes the workstream.

**No code changes in this plan.** Awaiting approval of v1 before starting B.1.
