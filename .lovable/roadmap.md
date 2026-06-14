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

**Status:** ✅ Frozen (production baseline)

Scope retained under freeze policy only. No new public features.

Allowed changes:

- Bug fixes
- Security updates
- Performance improvements
- Accessibility improvements
- Business content updates
- Backend integration

---

## v1.4 — HIGAET Academy Production Release

**Theme:** HIGAET Academy Production Release
**Objective:** Complete and production-freeze HIGAET Academy.
**Status:** 🚧 Next (active)

### Scope

- Complete Academy content registries (`src/content/academy/`: categories, courses, learning-paths, search-index, testimonials, index)
- Complete `AcademyHeader` component
- Complete Academy navigation (mega-menu, breadcrumbs, footer wiring)
- Complete Academy search integration (search-index + UI)
- Complete QA checklist (`.lovable/qa-checklist-3a1.md`)
- Complete SEO validation (titles, meta, OG/Twitter, JSON-LD, sitemap)
- Complete accessibility validation (WCAG 2.1 AA)
- Complete Lighthouse validation (≥90 across Performance, Accessibility, Best Practices, SEO)
- Freeze Academy

### Exit Criteria

- All Academy routes return 200, render correct head metadata, pass Lighthouse ≥90
- QA checklist 100% checked
- Academy added to Freeze Policy

### Out of Scope

- **Do not begin Global Education Hub development during v1.4.**

---

## v1.5 — Global Education Hub Phase 1

**Theme:** Global Education Hub Phase 1
**Objective:** Launch the first production-ready version of the Global Education Hub.
**Status:** 📋 Planned

### Scope

- Brand identity (`--hub` design tokens, typography, imagery system)
- Content registries (`src/content/hub/`)
- Countries
- Universities
- Scholarships
- Visa guidance
- Lead capture (`leads` table + RLS + admin views + public form)
- Search (search-index + UI)
- SEO (titles, meta, OG/Twitter, sitemap)
- JSON-LD (Organization, EducationalOrganization, Course, FAQPage, BreadcrumbList)
- QA (`.lovable/qa-checklist-5.md`)

### Exit Criteria

- All Hub routes production-ready, validated, and indexed
- Lead capture functional end-to-end with RLS verified
- Freeze Hub after release

---

## v1.6 — Shared Platform Enhancements

**Theme:** Shared Platform Enhancements
**Status:** 📋 Planned

### Scope

- Backend integration across divisions
- CMS improvements (content authoring workflows)
- Shared APIs (server functions consolidation)
- Workflow automation (lead routing, notifications)
- Lead management (CRM unification)
- Monitoring (logs, alerts, uptime)
- Performance improvements (caching, bundle, edge)

---

## v1.7 — AI Platform Expansion

**Theme:** AI Platform Expansion
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

**Theme:** Unified HIGAET Ecosystem
**Status:** 🎯 Target

### Goal

Integrate Technologies, Academy, and Global Education Hub into one production ecosystem with shared:

- Authentication
- Backend services
- Analytics
- AI
- Administration

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
- Review before every major development cycle.
- Update `Current Version`, `Current Phase`, `Active Development`, and `Version History` at every release boundary.
- Scope changes within an active version require updating this document **before** implementation.
