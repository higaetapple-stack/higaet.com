# HIGAET — Active Development Plan

> Scope: **v1.4 — HIGAET Academy Production Release**
> See `.lovable/roadmap.md` for the full multi-version product roadmap.
> Last updated: 2026-06-14

---

## Status

| Field              | Value                                                |
| ------------------ | ---------------------------------------------------- |
| Current Version    | v1.3                                                 |
| Current Phase      | Pre-v1.4 — Academy production hardening              |
| Active Development | HIGAET Academy completion                            |
| Next Version       | v1.4 — HIGAET Academy Production Release             |
| Future Versions    | v1.5 Hub · v1.6 Shared Platform · v1.7 AI · v2.0 Unified |

### Frozen Modules

- HIGAET Technologies v1.0 (public site)
- CRM / Finance / Support
- Auth flow
- LMS core tables
- Shared `Header` / `Footer` / `JsonLd` / `LeadForm` (extension only)

### Completed Versions

- v1.0 — HIGAET Technologies (frozen baseline)
- v1.1 — CRM / Finance / Support
- v1.2 — LMS core + Career
- v1.3 — Academy + Hub scaffolding

---

## v1.4 Objective

Complete and production-freeze **HIGAET Academy**. No Hub work during this version.

---

## v1.4 Workstreams

### A. Academy Content Registries
Create `src/content/academy/`:
- `categories.ts`
- `courses.ts`
- `learning-paths.ts`
- `search-index.ts`
- `testimonials.ts`
- `index.ts` (barrel)

### B. Academy Header & Navigation
- `src/components/academy/AcademyHeader.tsx`
- Mega-menu wiring
- Breadcrumbs on all Academy routes
- Footer links

### C. Search Integration
- Wire `search-index.ts` into Academy search UI
- Empty/zero-result states
- Keyboard accessibility

### D. SEO Validation
- Unique title (<60 chars) + meta description (<160 chars) per route
- OG/Twitter cards per route (leaf-level og:image)
- Canonical tags
- JSON-LD: `Organization`, `Course`, `BreadcrumbList`, `FAQPage` where applicable
- Sitemap entry coverage

### E. Accessibility Validation
- WCAG 2.1 AA
- Color contrast, focus rings, semantic landmarks, alt text, ARIA on interactive widgets

### F. Performance Validation
- Lighthouse ≥90 (Performance, Accessibility, Best Practices, SEO)
- Image lazy loading, route-level code splitting verified

### G. QA Checklist Closure
- Complete every item in `.lovable/qa-checklist-3a1.md`
- Add any newly identified items before sign-off

### H. Freeze
- Add Academy to Frozen Modules in `.lovable/roadmap.md` and this file
- Tag release v1.4

---

## v1.4 Exit Criteria

- ✅ All Academy routes 200 + correct head metadata
- ✅ Lighthouse ≥90 across all four categories
- ✅ `qa-checklist-3a1.md` 100% checked
- ✅ Accessibility audit clean
- ✅ Academy added to freeze policy
- ✅ `roadmap.md` Version History updated

---

## Out of Scope for v1.4

- Global Education Hub (v1.5)
- `--hub` / `--technologies` design tokens beyond what Academy needs
- `leads` table / Hub lead capture (v1.5)
- Backend integration work (v1.6)
- New AI features (v1.7)

---

## Next Action

Awaiting approval to begin Workstream **A** (Academy Content Registries). Implementation is **not** yet started — this document and `roadmap.md` constitute the planning deliverable for this turn.
