# ADR-0004 — Workstream Freeze Policy

**Status:** Accepted
**Date:** 2026-06-14
**Related:** ADR-0001, `src/content/ADR-FREEZE.md`

---

## Context

The Academy Registry v1.0 baseline is now frozen. We need an explicit,
reusable policy for what "frozen" means so future workstreams (B–H,
v1.5+) inherit the same governance without re-litigating it each time.

## Decision

A workstream is **frozen** when its public surface, contracts, and
file layout become immutable except via a superseding ADR + version
bump. The freeze contract lives in two places:

1. An in-repo `ADR-FREEZE*.md` next to the frozen code, listing:
   - frozen directories,
   - the public API surface,
   - allowed changes (bugs, perf, content additions, docs, validation
     improvements),
   - prohibited changes (schema redesign, signature changes, folder
     restructuring, slug removal without redirects).
2. A pinned label in Lovable Version History as the canonical
   rollback target.

## Rules

- Frozen directories may receive **additive** changes (new content,
  new exports) provided no existing contract or signature changes.
- Breaking changes require a new ADR + major version review.
- Consumer workstreams (e.g. Workstream B) layer on top of a freeze;
  they never modify the frozen baseline.
- Each new workstream that produces shared infrastructure ends with
  its own `ADR-FREEZE-*.md` and a version-history pin.

## Consequences

**Positive**
- Predictable stability for shared infrastructure.
- Clear rollback contract for any later regression.
- Cheap to apply: two artifacts (in-repo marker + version pin).

**Negative**
- Adds one document per frozen surface. Acceptable overhead.
