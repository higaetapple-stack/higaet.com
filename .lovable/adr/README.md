# HIGAET Architecture Decision Records (ADRs)

This directory is the permanent architectural history of the HIGAET ecosystem. Every decision that affects **shared infrastructure** lives here. Routine feature work does not.

---

## Index

| #    | Title                                                                  | Status     | Date       |
| ---- | ---------------------------------------------------------------------- | ---------- | ---------- |
| 0001 | [Registry Architecture](./0001-registry-architecture.md)               | Accepted   | 2026-06-14 |
| 0002 | Provider Layer (covered inside ADR-0001 §Provider boundary)            | Accepted   | 2026-06-14 |
| 0003 | [URL Resolution Strategy](./0003-url-resolution-strategy.md)           | Accepted   | 2026-06-14 |
| 0004 | [Workstream Freeze Policy](./0004-workstream-freeze-policy.md)         | Accepted   | 2026-06-14 |
| 0005 | Content Versioning                                                     | _reserved_ | —          |
| 0006 | Shared Design System                                                   | _reserved_ | —          |
| 0007 | Backend Boundary                                                       | _reserved_ | —          |
| 0008 | Authentication Strategy                                                | _reserved_ | —          |
| 0009 | SEO Architecture                                                       | _reserved_ | —          |
| 0010 | Analytics Architecture                                                 | _reserved_ | —          |
| 0011 | Deployment Strategy                                                    | _reserved_ | —          |
| 0012 | AI Platform Architecture                                               | _reserved_ | —          |

> Reserved slots are placeholders; create the file when the decision is taken. Numbers are assigned in order and never reused.

---

## When an ADR is required

Per `.lovable/roadmap.md` → **Architecture Governance**:

**Architecture-first** — ADR required:
- Design system / brand tokens
- Content providers and registry contracts
- Routing architecture
- SEO framework
- Analytics framework
- Authentication
- Backend boundary
- AI platform interfaces

**Implementation-only** — no ADR:
- New content (courses, articles, services, universities, testimonials, etc.)
- Bug fixes
- Copy edits
- Routine refactors within a single component

---

## Immutability

ADRs are **immutable after acceptance**. If a decision changes:

1. Create a new ADR with the next number.
2. Set the new ADR's `Status: Accepted` and reference the prior ADR in **Context**.
3. Edit only the **Status** field of the superseded ADR to `Superseded by ADR-NNNN` and update its **Version History**.

Never rewrite history. The ADR log is the project's architectural truth.

---

## Standard ADR Template

Use this template for every new ADR. Copy verbatim, then fill in.

```markdown
# ADR-NNNN: <Title>

- **Status:** Proposed | Accepted | Superseded by ADR-NNNN | Deprecated
- **Date:** YYYY-MM-DD
- **Deciders:** <names or roles>
- **Related:** ADR-NNNN, roadmap version, workstream

## Context
What problem are we solving? What forces are in play?

## Decision
The chosen approach, stated clearly.

## Alternatives Considered
Each alternative + why it was rejected.

## Consequences
- Positive
- Negative
- Neutral / tradeoffs

## Implementation Notes
Concrete file paths, naming conventions, rules to enforce.

## Dependencies
Other ADRs, libraries, infrastructure, or workstreams this depends on.

## Future Considerations
Known follow-ups, deferred questions, anticipated revisions.

## Version History
| Date       | Change                   |
| ---------- | ------------------------ |
| YYYY-MM-DD | Initial acceptance       |
```

---

## Authoring workflow

1. **Propose** — create the file with `Status: Proposed`.
2. **Review** — discuss with stakeholders; update the Decision and Alternatives.
3. **Accept** — flip `Status: Accepted`, set the date, lock the file.
4. **Implement** — workstream proceeds against the accepted ADR.
5. **Supersede** (if ever) — new ADR; old ADR's Status updated only.
