# HIGAET Product Roadmap

> Official, versioned product roadmap for the HIGAET ecosystem.
> Living document — review before every major development cycle.
> Last updated: 2026-06-14

---

## Snapshot

| Field              | Value                                                  |
| ------------------ | ------------------------------------------------------ |
| Current Version    | v1.3 (Academy scaffolded, Hub partially scaffolded)    |
| Current Phase      | Pre-v1.4 — Academy production hardening                |
| Active Development | HIGAET Academy completion (v1.4)                       |
| Next Version       | v1.4 — HIGAET Academy Production Release               |
| Frozen Modules     | HIGAET Technologies v1.0 (public site, CRM/Finance/Support, LMS core, Auth) |
| Target Vision      | v2.0 — Unified HIGAET Ecosystem                        |

---

## Release Strategy

HIGAET is managed as a multi-product ecosystem, not a single website. Each release ships **one division or platform layer at a time**, then is **frozen** before the next version begins. This minimizes regression risk, isolates SEO impact, and keeps QA scope linear.

### Freeze Policy

A frozen module accepts only:

- Bug fixes
- Security updates
- Performance improvements
- Accessibility improvements
- Business content updates (copy, registries, media)
- Backend integration plumbing

**No new public features** are added to a frozen module outside a planned version.

---

## Architecture Governance

### Architecture-first rule

Any change affecting **shared infrastructure** requires an ADR (see `.lovable/adr/`) before implementation:

- Design system / brand tokens
- Content providers and registry contracts
- Routing architecture
- SEO framework
- Analytics framework
- Authentication
- Backend boundary
- AI platform interfaces

### Implementation-only rule

Feature work **inside a division** (new courses, articles, services, testimonials, universities, programs, etc.) does **not** require an ADR. Routine content updates flow through the normal workstream cycle.

### Standard development workflow (every workstream)

```
Plan → Architecture Review → Implementation
   → Registry Tests → TypeScript → Build
   → Accessibility → SEO → QA Checklist → Freeze
```

### Registry version governance

| Change                          | Registry version bump  |
| ------------------------------- | ---------------------- |
| Add optional field              | None                   |
| Add new registry entry (row)    | None                   |
| Add new registry file           | Minor (1.0 → 1.1)      |
| Remove field                    | Major (1.x → 2.0)      |
| Rename field                    | Major (1.x → 2.0)      |
| Change field type               | Major (1.x → 2.0)      |

Each registry exports its own `*_REGISTRY_VERSION`; the shared system exports `REGISTRY_SYSTEM_VERSION`.

---

## Version Roadmap

| Version | Theme                          | Status         |
| ------- | ------------------------------ | -------------- |
| v1.0    | HIGAET Technologies            | ✅ Frozen      |
| v1.4    | HIGAET Academy                 | 🚧 Next        |
| v1.5    | Global Education Hub Phase 1   | 📋 Planned     |
| v1.6    | Shared Platform Enhancements   | 📋 Planned     |
| v1.7    | AI Platform Expansion          | 📋 Planned     |
| v2.0    | Unified HIGAET Ecosystem       | 🎯 Target      |

---

## HIGAET Technologies v1.0 — Frozen Baseline

**Status:** ✅ Frozen (production baseline). Freeze-policy changes only.

---

## v1.4 — HIGAET Academy Production Release

**Theme:** HIGAET Academy Production Release
**Objective:** Complete and production-freeze HIGAET Academy.
**Status:** 🚧 Next (active)

### Scope

- Complete Academy content registries (via the canonical HIGAET Registry System — see ADR-0001)
- Complete `AcademyHeader` component
- Complete Academy navigation (mega-menu, breadcrumbs, footer wiring)
- Complete Academy search integration
- Complete QA checklist (`.lovable/qa-checklist-3a1.md`)
- Complete SEO validation (titles, meta, OG/Twitter, JSON-LD, sitemap)
- Complete accessibility validation (WCAG 2.1 AA)
- Complete Lighthouse validation (≥90 across all four categories)
- Freeze Academy

### Out of Scope

- **Global Education Hub work is deferred to v1.5.**

---

## v1.5 — Global Education Hub Phase 1

**Status:** 📋 Planned

### Scope

- `--hub` brand tokens
- Hub content registries (countries, universities, scholarships, visa, testimonials) — consumes the canonical Registry System
- Hub UI components (header, mega-menu, cards, tiles)
- `leads` table + RLS + admin views + public lead form
- Search, SEO, JSON-LD, sitemap
- QA + freeze

---

## v1.6 — Shared Platform Enhancements

**Status:** 📋 Planned

### Scope

- Backend integration (Node.js + Express + MySQL) behind the provider layer
- CMS improvements
- Shared APIs
- Workflow automation
- Lead management (CRM unification)
- Monitoring
- Performance improvements

---

## v1.7 — AI Platform Expansion

**Status:** 📋 Planned

### Scope

- AI Tutor improvements
- AI Career Coach
- AI University Advisor
- AI Knowledge Base
- AI Recommendations
- AI Automation

---

## v2.0 — Unified HIGAET Ecosystem

**Status:** 🎯 Target

Integrate Technologies, Academy, and Global Education Hub into one production ecosystem with shared authentication, backend services, analytics, AI, and administration.

---

## Version History

| Version | Date       | Summary                                                    |
| ------- | ---------- | ---------------------------------------------------------- |
| v1.0    | 2026-Q1    | HIGAET Technologies production release — frozen baseline   |
| v1.1    | 2026-Q1    | CRM / Finance / Support modules                            |
| v1.2    | 2026-Q2    | LMS core + Career module                                   |
| v1.3    | 2026-Q2    | Academy + Hub scaffolding                                  |
| v1.4    | _planned_  | HIGAET Academy production release                          |
| v1.5    | _planned_  | Global Education Hub Phase 1                               |
| v1.6    | _planned_  | Shared Platform Enhancements                               |
| v1.7    | _planned_  | AI Platform Expansion                                      |
| v2.0    | _target_   | Unified HIGAET Ecosystem                                   |

---

## Governance

- This roadmap is the **single source of truth** for HIGAET release planning.
- Architectural decisions are recorded in `.lovable/adr/` (immutable after acceptance).
- Review this roadmap before every major development cycle.
- Update `Current Version`, `Current Phase`, `Active Development`, and `Version History` at every release boundary.
