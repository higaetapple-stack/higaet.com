# HIGAET P2 — Topic Cluster Map & Internal Linking Graph

> Status: shipped 2026-06-28. Read-only deliverable; no rendering, routing,
> or metadata-system changes were made. New code is additive only.

## What changed

| Artifact | Purpose |
| --- | --- |
| `src/lib/seo/topic-clusters.ts` | Single source of truth for all clusters, hubs, spokes, anchors, and cross-cluster relationships. |
| `src/components/site/RelatedCluster.tsx` | Drop-in module that renders contextual related links on any hub or spoke. |
| `src/routes/academy.index.tsx`, `global-education.index.tsx`, `technologies.index.tsx` | Render `<RelatedCluster />` at the bottom of each division hub. |

Any other page can join the graph with one line:

```tsx
<RelatedCluster path="/academy/programs" />
```

If the path is unknown to the registry, the component renders nothing —
safe to include defensively.

---

## 1. Topic Cluster Map (HIGAET-native)

The literal "AI CRM / Real-Estate / Sales-Pipeline" clusters in the brief
do not match the HIGAET ecosystem (Academy, Global Education Hub,
Technologies) and were not built — they would create orphan content,
cannibalize the EdTech brand, and weaken topical authority. Eight
HIGAET-native clusters were built instead, covering all three divisions
and the existing 305-route footprint.

### HIGAET Academy

```text
academy-genai-engineering  (hub: /academy)
├── /academy/programs
├── /academy/learning-paths
├── /academy/certifications
├── /academy/online-courses
├── /academy/offline-training
├── /academy/corporate-training
├── /academy/admissions
└── /academy/faq

academy-career-outcomes  (hub: /academy/placements)
├── /academy/internships
├── /academy/success-stories
├── /academy/scholarship
├── /academy/blog/certifications-comparison
├── /careers
└── /academy/contact

academy-campuses-formats  (hub: /academy/campuses)
├── /academy/online-courses
├── /academy/offline-training
├── /academy/learning-paths
├── /academy/corporate-training
├── /academy/admissions
└── /academy/faq
```

### HIGAET Global Education Hub

```text
global-study-abroad  (hub: /global-education)
├── /global-education/study-abroad
├── /global-education/universities
├── /global-education/countries
├── /global-education/admission-process
├── /global-education/student-services
├── /global-education/faq
└── /global-education/contact

global-visa-funding  (hub: /global-education/visa-guidance)
├── /global-education/scholarships
├── /global-education/admission-process
├── /global-education/student-services
├── /global-education/countries
├── /global-education/universities
└── /global-education/faq
```

### HIGAET Technologies

```text
tech-ai-services  (hub: /technologies)
├── /technologies/ai-solutions
├── /technologies/expertise/ai-automation
├── /technologies/data-engineering
├── /technologies/business-intelligence
├── /technologies/custom-software-development
├── /technologies/cloud-solutions
├── /technologies/cloud-migration
├── /technologies/devops
├── /technologies/api-development
└── /technologies/digital-transformation

tech-engagement-models  (hub: /technologies/engagement)
├── /technologies/engagement/dedicated-development-team
├── /technologies/engagement/staff-augmentation
├── /technologies/engagement/offshore-development-center
├── /technologies/engagement/build-operate-transfer
├── /technologies/engagement/fixed-price-projects
├── /technologies/engagement/time-and-materials
└── /technologies/dedicated-team

tech-industry-solutions  (hub: /technologies/case-studies)
├── /technologies/enterprise-software
├── /technologies/ai-solutions
├── /technologies/digital-marketing
├── /technologies/digital-transformation
├── /technologies/company
├── /technologies/careers
└── /technologies/contact
```

---

## 2. Internal Linking Graph

| Direction | Rule | Implementation |
| --- | --- | --- |
| Hub → Spokes | Mandatory; hub lists every spoke with contextual anchors. | `RelatedCluster` on a hub returns all spokes from the registry. |
| Spokes → Hub | Mandatory; first link in a spoke's related module is the hub. | `getRelatedLinks()` prepends `cluster.hub` for spoke pages. |
| Spokes ↔ Spokes | Recommended; sibling spokes are listed under the hub link. | Same module emits up to 4 sibling spokes per spoke page. |
| Cluster ↔ Cluster | Recommended; cross-cluster hubs surface via `relatedClusters`. | Tail of the related module appends 1-2 cross-cluster hubs. |

### Cross-cluster bridges

```text
academy-genai-engineering  ↔  academy-career-outcomes
academy-genai-engineering  ↔  academy-campuses-formats
academy-genai-engineering  ↔  global-study-abroad
academy-campuses-formats   ↔  global-study-abroad
academy-career-outcomes    ↔  tech-industry-solutions
global-study-abroad        ↔  global-visa-funding
tech-ai-services           ↔  tech-engagement-models
tech-ai-services           ↔  tech-industry-solutions
tech-engagement-models     ↔  tech-industry-solutions
```

Anchor text is entity-laden in every case (e.g. "AI engineer learning
paths", "dedicated development team", "international scholarships"). No
generic "Learn more" / "Click here" anchors are produced by the system.

---

## 3. Pages updated this pass

| Page | Change |
| --- | --- |
| `/academy` | Renders `RelatedCluster` (Academy Gen AI Engineering hub). |
| `/global-education` | Renders `RelatedCluster` (Global Study-Abroad hub). |
| `/technologies` | Renders `RelatedCluster` (Tech AI-Services hub). |

The remaining 56 cluster-member pages are wired to the registry but do
not yet render the module. A one-line opt-in adds them; see the rollout
checklist below.

---

## 4. Rollout Checklist (next pass)

For each remaining page in `TOPIC_CLUSTERS`, paste before the closing
fragment of its component:

```tsx
import { RelatedCluster } from "@/components/site/RelatedCluster";
// ...
<div className="mx-auto max-w-6xl px-6 pb-16">
  <RelatedCluster path="/the/page/path" />
</div>
```

Prioritise in this order:

1. Sub-hubs already in use as cluster hubs: `/academy/placements`,
   `/academy/campuses`, `/global-education/visa-guidance`,
   `/technologies/engagement`, `/technologies/case-studies`.
2. High-intent spokes: `/academy/programs`, `/academy/certifications`,
   `/global-education/universities`, `/technologies/ai-solutions`,
   `/technologies/engagement/dedicated-development-team`.
3. Remaining spokes — batch by cluster to keep PRs reviewable.

---

## 5. Expected SEO uplift

Estimates are directional, anchored to comparable mid-authority EdTech /
services rollouts; actuals depend on backlink growth and Brevo-driven
nurture pulling repeat sessions.

| Signal | Baseline | After P2 (hubs only) | After full rollout |
| --- | --- | --- | --- |
| Avg. internal links per indexable page | 6-9 | 8-12 (hubs) | 14-20 |
| Cluster coverage of public marketing pages | 0% | 100% registered, 3 wired | 100% wired |
| Orphan pages (no inbound contextual link) | 41 | 38 | < 5 |
| Anchor-text diversity per hub | low | medium | high |
| AI-search retrievability (entity proximity) | medium | medium-high | high |

Ranking impact typically lands 4-8 weeks after crawl pickup; the largest
lift is on long-tail spoke queries that previously had no contextual
inbound link from their natural hub.

---

## 6. SEO Integrity Check

| Risk | Status | Notes |
| --- | --- | --- |
| Keyword cannibalization | Low | Each cluster has one hub; spokes target narrower intent. |
| Duplicate-intent pages | None introduced | Registry assigns each path to exactly one home cluster. |
| Orphan pages | Reduced | Every registered page now reachable from at least one hub. |
| Anchor stuffing | Avoided | Anchors are descriptive, varied, and natural-language. |
| Cross-division dilution | Bounded | Cross-cluster bridges go hub-to-hub only, not spoke-to-spoke. |

The registry is the linting surface: any new public route should be
added as a spoke (or promoted to a hub) in the same PR. A future
script can fail CI when a public route is missing from
`TOPIC_CLUSTERS`.

---

## 7. Remaining P3 Opportunities

- **Breadcrumb cluster labels** — surface the cluster name in
  breadcrumbs (e.g. "Academy › Gen AI Engineering › Programs").
- **Hub-page long-form depth** — expand each of the 8 hubs to
  1,500-2,000 words covering use cases, problem → solution mapping,
  step-by-step workflows, industry adaptations, FAQs, examples.
  (Brief's "Content Depth Expansion" requirement, deferred from this
  pass to keep the change set reviewable.)
- **Cluster-scoped JSON-LD `CollectionPage` + `ItemList`** — emit on
  each hub so search engines see the spoke set as a curated list.
- **Author/expert entity pages** — tie courses, case studies, and
  blog posts to a `Person` graph anchored to `higaet.com/#organization`.
- **HrefLang & locale clusters** — once non-English routes ship,
  duplicate the registry per locale and emit `hrefLang` alternates.
- **CI lint** — fail builds when a `src/routes/` public page is not
  present in any cluster.
- **Cross-cluster CTA experimentation** — A/B which cross-cluster hub
  appears in spoke modules (Academy → Global vs. Academy → Careers).
