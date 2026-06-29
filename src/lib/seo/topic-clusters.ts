/**
 * HIGAET topic-cluster registry.
 *
 * Drives the internal-linking graph and on-page "Related" modules so search
 * engines (and LLM crawlers) see clear hub-and-spoke topical authority.
 *
 * Read-only data. Pages opt-in by importing `getCluster(path)` or rendering
 * <RelatedCluster path="/..." />. Adding/removing a route here does not
 * affect routing, rendering, or metadata pipelines.
 *
 * Rules:
 *  - Every public marketing page should belong to exactly one cluster.
 *  - Each cluster has one hub and 5-10 spokes (currently 6-10).
 *  - Anchor text is contextual (entity-laden), never "click here".
 */

export type ClusterId =
  | "academy-genai-engineering"
  | "academy-career-outcomes"
  | "academy-campuses-formats"
  | "global-study-abroad"
  | "global-visa-funding"
  | "tech-ai-services"
  | "tech-engagement-models"
  | "tech-industry-solutions";

export interface ClusterNode {
  /** Absolute path under the site root. Must match an existing route. */
  path: string;
  /** Contextual anchor used when linking TO this page. */
  anchor: string;
  /** One-line snippet rendered in related modules and JSON-LD descriptions. */
  blurb: string;
}

export interface TopicCluster {
  id: ClusterId;
  /** Human title for the cluster (used in nav modules + docs). */
  title: string;
  /** Primary keyword/entity the cluster targets. */
  primaryEntity: string;
  /** Hub page — broad pillar that links to every spoke. */
  hub: ClusterNode;
  /** Spoke pages — narrow intent, each linking back to the hub. */
  spokes: ClusterNode[];
  /** Cross-cluster recommendations for spoke<->spoke depth. */
  relatedClusters?: ClusterId[];
}

export const TOPIC_CLUSTERS: Record<ClusterId, TopicCluster> = {
  // ─────────────────────────── ACADEMY ────────────────────────────
  "academy-genai-engineering": {
    id: "academy-genai-engineering",
    title: "Gen AI Engineering Programs",
    primaryEntity: "HIGAET Academy",
    hub: {
      path: "/academy",
      anchor: "HIGAET Academy",
      blurb: "Gen AI engineering programs, certifications, and learning paths.",
    },
    spokes: [
      { path: "/academy/programs", anchor: "Gen AI degree & diploma programs", blurb: "Full catalog of HIGAET Academy programs." },
      { path: "/academy/learning-paths", anchor: "AI engineer learning paths", blurb: "Curated tracks from beginner to specialist." },
      { path: "/academy/certifications", anchor: "industry-recognized AI certifications", blurb: "HIGAET certifications with employer validation." },
      { path: "/academy/online-courses", anchor: "online AI courses", blurb: "Self-paced and cohort-based online learning." },
      { path: "/academy/offline-training", anchor: "campus-based AI training", blurb: "In-person training at HIGAET campuses." },
      { path: "/academy/corporate-training", anchor: "corporate Gen AI upskilling", blurb: "Enterprise training programs for engineering teams." },
      { path: "/academy/admissions", anchor: "Academy admissions process", blurb: "Eligibility, intake, and how to apply." },
      { path: "/academy/faq", anchor: "Academy FAQs", blurb: "Common questions about HIGAET Academy programs." },
    ],
    relatedClusters: ["academy-career-outcomes", "academy-campuses-formats", "global-study-abroad"],
  },

  "academy-career-outcomes": {
    id: "academy-career-outcomes",
    title: "Career Outcomes & Placements",
    primaryEntity: "AI engineering careers",
    hub: {
      path: "/academy/placements",
      anchor: "HIGAET placements & career outcomes",
      blurb: "Hiring partners, salary ranges, and placement reports.",
    },
    spokes: [
      { path: "/academy/internships", anchor: "AI engineering internships", blurb: "Internship pathways with HIGAET partner companies." },
      { path: "/academy/success-stories", anchor: "alumni success stories", blurb: "Career outcomes of HIGAET graduates." },
      { path: "/academy/scholarship", anchor: "merit and need-based scholarships", blurb: "Funding options for Academy learners." },
      { path: "/academy/blog/certifications-comparison", anchor: "comparing AI certifications", blurb: "How HIGAET credentials compare across the industry." },
      { path: "/careers", anchor: "open roles at HIGAET", blurb: "Career opportunities across the HIGAET ecosystem." },
      { path: "/academy/contact", anchor: "talk to an admissions counselor", blurb: "Reach the HIGAET career & admissions team." },
    ],
    relatedClusters: ["academy-genai-engineering", "tech-industry-solutions"],
  },

  "academy-campuses-formats": {
    id: "academy-campuses-formats",
    title: "Campuses & Learning Formats",
    primaryEntity: "HIGAET campuses",
    hub: {
      path: "/academy/campuses",
      anchor: "HIGAET Academy campuses",
      blurb: "Global campus network and learning formats.",
    },
    spokes: [
      { path: "/academy/campuses/bengaluru", anchor: "HIGAET Bengaluru campus", blurb: "Industry diploma delivered at the Bengaluru campus." },
      { path: "/academy/campuses/hyderabad", anchor: "HIGAET Hyderabad campus", blurb: "Industry diploma delivered at the Hyderabad campus." },
      { path: "/academy/programs", anchor: "campus program catalog", blurb: "Programs delivered across HIGAET campuses." },
      { path: "/academy/contact", anchor: "book a campus visit", blurb: "Guided campus tour or virtual walkthrough." },
      { path: "/academy/success-stories", anchor: "alumni from HIGAET campuses", blurb: "Outcomes from on-campus learners." },
      { path: "/academy/placements", anchor: "campus placement support", blurb: "Career outcomes for on-campus cohorts." },
    ],
    relatedClusters: ["academy-genai-engineering", "global-study-abroad"],
  },

  // ────────────────────── GLOBAL EDUCATION HUB ─────────────────────
  "global-study-abroad": {
    id: "global-study-abroad",
    title: "Study Abroad & University Pathways",
    primaryEntity: "HIGAET Global Education Hub",
    hub: {
      path: "/global-education",
      anchor: "HIGAET Global Education Hub",
      blurb: "Study abroad pathways, university partners, and counselor support.",
    },
    spokes: [
      { path: "/global-education/study-abroad", anchor: "study abroad programs", blurb: "End-to-end study abroad guidance." },
      { path: "/global-education/universities", anchor: "partner universities", blurb: "Vetted institutions across our network." },
      { path: "/global-education/countries", anchor: "study destinations by country", blurb: "Country guides for top study destinations." },
      { path: "/global-education/admission-process", anchor: "international admissions process", blurb: "Step-by-step intake and application." },
      { path: "/global-education/student-services", anchor: "pre-departure & student services", blurb: "Housing, orientation, and on-arrival support." },
      { path: "/global-education/faq", anchor: "study abroad FAQs", blurb: "Eligibility, timelines, and costs." },
      { path: "/global-education/contact", anchor: "speak with an education counselor", blurb: "1:1 counseling for university selection." },
    ],
    relatedClusters: ["global-visa-funding", "academy-genai-engineering"],
  },

  "global-visa-funding": {
    id: "global-visa-funding",
    title: "Visa Guidance & Funding",
    primaryEntity: "student visa guidance",
    hub: {
      path: "/global-education/visa-guidance",
      anchor: "HIGAET visa guidance",
      blurb: "Visa documentation, SOPs, and embassy interview prep.",
    },
    spokes: [
      { path: "/global-education/scholarships", anchor: "international scholarships", blurb: "Merit and need-based funding across destinations." },
      { path: "/global-education/services/visa-guidance", anchor: "visa documentation service", blurb: "Country-aware visa documentation support." },
      { path: "/global-education/services/scholarships", anchor: "scholarship advisory", blurb: "Advisory for funding international study." },
      { path: "/global-education/services/financial-counseling", anchor: "financial counseling", blurb: "Education loans, GIC, and sponsorship planning." },
      { path: "/global-education/services/pre-departure", anchor: "pre-departure briefings", blurb: "Travel, accommodation, and arrival readiness." },
      { path: "/global-education/contact", anchor: "talk to a visa counsellor", blurb: "1:1 visa counseling appointments." },
    ],
    relatedClusters: ["global-study-abroad"],
  },

  // ──────────────────────── HIGAET TECHNOLOGIES ────────────────────
  "tech-ai-services": {
    id: "tech-ai-services",
    title: "AI & Engineering Services",
    primaryEntity: "HIGAET Technologies",
    hub: {
      path: "/technologies",
      anchor: "HIGAET Technologies services",
      blurb: "AI, data, cloud, and software engineering for enterprises.",
    },
    spokes: [
      { path: "/technologies/ai-solutions", anchor: "applied AI solutions", blurb: "Production-grade AI systems for business." },
      { path: "/technologies/expertise/ai-automation", anchor: "AI automation expertise", blurb: "Workflow and process automation with AI." },
      { path: "/technologies/data-engineering", anchor: "data engineering services", blurb: "Pipelines, lakehouses, and analytics platforms." },
      { path: "/technologies/business-intelligence", anchor: "business intelligence", blurb: "Dashboards and decision intelligence." },
      { path: "/technologies/custom-software-development", anchor: "custom software engineering", blurb: "Bespoke product engineering." },
      { path: "/technologies/cloud-solutions", anchor: "cloud solutions", blurb: "Architecture across AWS, Azure, and GCP." },
      { path: "/technologies/cloud-migration", anchor: "cloud migration", blurb: "Lift-and-shift and re-platform programs." },
      { path: "/technologies/devops", anchor: "DevOps & platform engineering", blurb: "CI/CD, SRE, and platform teams." },
      { path: "/technologies/api-development", anchor: "API development", blurb: "Public, partner, and internal APIs." },
      { path: "/technologies/digital-transformation", anchor: "digital transformation programs", blurb: "Multi-year modernization roadmaps." },
    ],
    relatedClusters: ["tech-engagement-models", "tech-industry-solutions"],
  },

  "tech-engagement-models": {
    id: "tech-engagement-models",
    title: "Engagement Models",
    primaryEntity: "software engagement models",
    hub: {
      path: "/technologies/engagement",
      anchor: "HIGAET engagement models",
      blurb: "How HIGAET Technologies contracts with clients.",
    },
    spokes: [
      { path: "/technologies/engagement/dedicated-development-team", anchor: "dedicated development team", blurb: "Long-running team embedded with the client." },
      { path: "/technologies/engagement/staff-augmentation", anchor: "staff augmentation", blurb: "Skilled engineers added to existing teams." },
      { path: "/technologies/engagement/offshore-development-center", anchor: "offshore development center", blurb: "Owned offshore capacity at HIGAET." },
      { path: "/technologies/engagement/build-operate-transfer", anchor: "build-operate-transfer", blurb: "Stand up, operate, and hand over a team." },
      { path: "/technologies/engagement/fixed-price-projects", anchor: "fixed-price projects", blurb: "Scoped deliverables with milestone pricing." },
      { path: "/technologies/engagement/time-and-materials", anchor: "time and materials", blurb: "Flexible engagements billed by effort." },
      { path: "/technologies/dedicated-team", anchor: "dedicated team overview", blurb: "Overview of dedicated team setups." },
    ],
    relatedClusters: ["tech-ai-services", "tech-industry-solutions"],
  },

  "tech-industry-solutions": {
    id: "tech-industry-solutions",
    title: "Industry Solutions & Proof",
    primaryEntity: "AI industry solutions",
    hub: {
      path: "/technologies/case-studies",
      anchor: "HIGAET Technologies case studies",
      blurb: "Outcomes across industries and engagement types.",
    },
    spokes: [
      { path: "/technologies/enterprise-software", anchor: "enterprise software", blurb: "Enterprise-grade product engineering." },
      { path: "/technologies/digital-marketing", anchor: "AI-powered digital marketing", blurb: "MarTech and growth engineering." },
      { path: "/technologies/company", anchor: "about HIGAET Technologies", blurb: "Team, capabilities, and leadership." },
      { path: "/technologies/careers", anchor: "Technologies careers", blurb: "Engineering and consulting roles." },
      { path: "/technologies/contact", anchor: "talk to a solutions architect", blurb: "Scope a new engagement." },
      { path: "/technologies/industries", anchor: "industries we serve", blurb: "Sector-aligned solutions and reference architectures." },
      { path: "/technologies/services", anchor: "service catalog", blurb: "Full HIGAET Technologies service portfolio." },
    ],
    relatedClusters: ["tech-ai-services", "tech-engagement-models"],
  },
};

/** Build a lookup of path -> {cluster, role, node}. */
const PATH_INDEX = (() => {
  const map = new Map<string, { cluster: TopicCluster; role: "hub" | "spoke"; node: ClusterNode }>();
  for (const cluster of Object.values(TOPIC_CLUSTERS)) {
    map.set(cluster.hub.path, { cluster, role: "hub", node: cluster.hub });
    for (const spoke of cluster.spokes) {
      // Only register first occurrence so a page's "home" cluster wins.
      if (!map.has(spoke.path)) map.set(spoke.path, { cluster, role: "spoke", node: spoke });
    }
  }
  return map;
})();

/** Look up the cluster a given path belongs to (hub or spoke). */
export function getCluster(path: string) {
  return PATH_INDEX.get(path) ?? null;
}

/** All cluster definitions as a flat array. */
export function listClusters(): TopicCluster[] {
  return Object.values(TOPIC_CLUSTERS);
}

/**
 * Build a "related links" list for a given page.
 * - Hub pages → return all spokes.
 * - Spoke pages → return the hub + sibling spokes + a cross-cluster suggestion.
 */
export function getRelatedLinks(path: string, limit = 6): ClusterNode[] {
  const entry = PATH_INDEX.get(path);
  if (!entry) return [];
  const { cluster, role } = entry;

  if (role === "hub") {
    return cluster.spokes.slice(0, limit);
  }

  const out: ClusterNode[] = [cluster.hub];
  for (const spoke of cluster.spokes) {
    if (spoke.path !== path && out.length < limit) out.push(spoke);
  }
  // Cross-cluster: one anchor from each related cluster's hub.
  for (const relatedId of cluster.relatedClusters ?? []) {
    if (out.length >= limit) break;
    const related = TOPIC_CLUSTERS[relatedId];
    if (related && !out.some((n) => n.path === related.hub.path)) {
      out.push(related.hub);
    }
  }
  return out.slice(0, limit);
}
