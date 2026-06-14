# ADR-0003 — URL Resolution Strategy

**Status:** Accepted
**Date:** 2026-06-14
**Supersedes:** —
**Related:** ADR-0001 (Registry Architecture), `src/content/ADR-FREEZE.md`

---

## Context

Registry entries store stable identifiers (`id`, `slug`) but not URLs.
The generated read models (`breadcrumbs.ts`, `sitemap.ts`) currently
emit fully-qualified paths like `/academy/categories/{slug}` and
`/academy/learning-paths/{slug}`. The live Academy routes are flat
(`/academy/online-courses`, `/academy/learning-paths`), so consumer
code can't use the generated `path` directly.

Two options were considered:

1. Teach the generators about current route shapes.
2. Keep generators route-agnostic; resolve URLs at the consumer
   boundary via a small provider-layer helper.

## Decision

**Option 2.** Introduce a **URL Resolver** in the provider layer.

```text
Registry  →  URL Resolver  →  Consumers (links, breadcrumbs, sitemap, JSON-LD)
```

The resolver lives at `src/content/providers/academy-urls.ts` and
exposes pure functions that map a registry entity (or its key) to
the current live route path. The breadcrumb and sitemap generators
stay generic; consumers compose them with the resolver when they
need an actual URL.

## Consequences

**Positive**
- Routing changes touch one file (`academy-urls.ts`), not registries
  or generators.
- Registries and generators remain pure data — no routing coupling.
- Frozen baseline (Academy Registry v1.0) is preserved: this is an
  additive provider-layer export, not a contract change.
- JSON-LD, breadcrumbs, mega menu, and sitemap share a single source
  of truth for URLs.

**Negative**
- One extra hop for consumers building hrefs (`academyCourseUrl(course)`
  vs `course.path`). Acceptable for the decoupling it buys.

## Rules

- Consumers MUST go through the resolver for any Academy entity URL.
  Inline route strings (`/academy/${slug}`) are not allowed in
  consumer code once B.6 lands.
- The resolver is the only place that encodes Academy URL shapes.
- The resolver MUST NOT import from registries directly; it operates
  on entity instances (or keys) passed by the caller.

## Status & rollout

- Lands in Workstream B as a prerequisite for B.6 (Breadcrumb
  Migration). Referenced by B.3 (mega menu) and B.5 (metadata /
  JSON-LD) as well.
