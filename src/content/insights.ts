// Knowledge Center registry for HIGAET Technologies.
// Content is fully original, structured for SEO/AIO and rendered through
// the reusable InsightDetailPage component.

export type InsightCategory =
  | "software-engineering"
  | "ai"
  | "generative-ai"
  | "machine-learning"
  | "cloud"
  | "devops"
  | "cybersecurity"
  | "data-engineering"
  | "business-intelligence"
  | "digital-transformation"
  | "enterprise-architecture"
  | "product-engineering"
  | "saas"
  | "ui-ux"
  | "industry-insights";

export const CATEGORY_LABELS: Record<InsightCategory, string> = {
  "software-engineering": "Software Engineering",
  ai: "Artificial Intelligence",
  "generative-ai": "Generative AI",
  "machine-learning": "Machine Learning",
  cloud: "Cloud Computing",
  devops: "DevOps",
  cybersecurity: "Cybersecurity",
  "data-engineering": "Data Engineering",
  "business-intelligence": "Business Intelligence",
  "digital-transformation": "Digital Transformation",
  "enterprise-architecture": "Enterprise Architecture",
  "product-engineering": "Product Engineering",
  saas: "SaaS",
  "ui-ux": "UI / UX",
  "industry-insights": "Industry Insights",
};

export type InsightAuthor = {
  name: string;
  role: string;
  bio: string;
};

export type InsightSection = {
  id: string;
  heading: string;
  body: string[]; // each entry = one paragraph
  callout?: { label: string; body: string };
  bullets?: string[];
};

export type InsightFAQ = { question: string; answer: string };

export type InsightContent = {
  slug: string;
  path: string;            // canonical path
  category: InsightCategory;
  tags: string[];
  title: string;
  metaTitle: string;
  metaDescription: string;
  excerpt: string;
  publishedAt: string;     // ISO date
  updatedAt?: string;
  readingMinutes: number;
  featured?: boolean;
  author: InsightAuthor;
  executiveSummary: string;
  sections: InsightSection[];
  relatedServiceSlugs: string[];
  relatedTechnologySlugs: string[];
  relatedIndustrySlugs: string[];
  relatedCaseStudySlugs: string[];
  faqs: InsightFAQ[];
  cta: { title: string; body: string };
};

// Authors are intentionally institutional — HIGAET writes as a team and
// avoids fabricated personal claims. Update with real authors as the
// editorial team grows.
const TEAM_EDITORIAL: InsightAuthor = {
  name: "HIGAET Editorial",
  role: "HIGAET Technologies research team",
  bio: "Engineers, architects, and analysts from the HIGAET Technologies practice writing about what they ship.",
};

const TEAM_AI: InsightAuthor = {
  name: "HIGAET AI Practice",
  role: "Applied AI engineering team",
  bio: "Our applied AI engineers ship LLM, ML, and data products for enterprise clients across regulated industries.",
};

const TEAM_PLATFORM: InsightAuthor = {
  name: "HIGAET Platform Engineering",
  role: "Cloud, DevOps & platform team",
  bio: "Cloud, DevOps, and reliability engineers building the platforms that carry HIGAET-delivered software.",
};

export const INSIGHTS: InsightContent[] = [
  {
    slug: "engineering-production-rag-systems",
    path: "/technologies/insights/engineering-production-rag-systems",
    category: "generative-ai",
    tags: ["RAG", "LLM", "Enterprise AI", "Vector Search"],
    title: "Engineering production-grade RAG systems for the enterprise",
    metaTitle: "Production-grade RAG: an enterprise engineering playbook | HIGAET",
    metaDescription:
      "How HIGAET Technologies designs, evaluates, and operates retrieval-augmented generation systems for regulated enterprise workloads.",
    excerpt:
      "A practical playbook for moving RAG from a notebook demo to a governed, observable, and cost-controlled enterprise system.",
    publishedAt: "2026-05-30",
    readingMinutes: 11,
    featured: true,
    author: TEAM_AI,
    executiveSummary:
      "RAG is no longer a prototype technique. We outline the architecture, evaluation harness, governance model, and cost controls HIGAET applies when shipping retrieval-augmented assistants into regulated enterprise environments.",
    sections: [
      {
        id: "why-rag",
        heading: "Why RAG still matters in 2026",
        body: [
          "Foundation models keep improving, but enterprise data does not move into them. RAG remains the most defensible way to put proprietary knowledge under model reasoning without leaking it into pre-training corpora or accepting unbounded fine-tuning costs.",
          "The interesting work has shifted from 'does retrieval work' to 'does retrieval work for our compliance, latency, and cost envelope'. That is an engineering problem, not a research one.",
        ],
      },
      {
        id: "reference-architecture",
        heading: "Reference architecture",
        body: [
          "A production RAG system is at minimum: an ingestion pipeline, a chunking and embedding strategy, a vector store with metadata filters, a retriever, a reranker, an orchestrator, and an evaluation loop. Each component is replaceable; the contracts between them are not.",
        ],
        bullets: [
          "Ingestion: source connectors with explicit ownership and refresh SLAs",
          "Indexing: deterministic chunking, embedding versioning, document-level access control",
          "Retrieval: hybrid (lexical + dense), filtered by tenant, role, and recency",
          "Reasoning: function-calling LLM with grounded citation requirements",
          "Observability: token, latency, retrieval-precision, and answer-quality metrics",
        ],
      },
      {
        id: "evaluation",
        heading: "Evaluation that survives contact with users",
        body: [
          "Vibes-based testing collapses the first time the model is patched upstream. We build a gold set per use case, automate retrieval and answer scoring with an LLM-as-judge plus deterministic checks, and gate releases on regression deltas.",
        ],
        callout: {
          label: "Field note",
          body: "A 200-item gold set, refreshed quarterly, catches more than 90% of regressions our enterprise clients would otherwise hear from their users first.",
        },
      },
      {
        id: "governance",
        heading: "Governance, privacy, and audit",
        body: [
          "Regulated buyers expect data-lineage, prompt-and-response logging with PII redaction, role-based access to indexes, and the ability to delete a document and have it disappear from answers within an SLA. None of that is optional, and all of it should be designed before the first retrieval call.",
        ],
      },
      {
        id: "cost",
        heading: "Cost discipline",
        body: [
          "Token cost is the headline number, but the larger spend is usually retrieval and storage at scale. We model unit cost per answered question, instrument it from day one, and treat unbounded context windows as an anti-pattern.",
        ],
      },
    ],
    relatedServiceSlugs: ["ai-solutions", "data-engineering", "enterprise-software"],
    relatedTechnologySlugs: ["openai", "generative-ai", "python", "postgresql"],
    relatedIndustrySlugs: ["fintech", "healthcare", "enterprise"],
    relatedCaseStudySlugs: ["healthcare-ai-clinical-copilot", "global-fintech-payments-modernization"],
    faqs: [
      {
        question: "When should we choose RAG over fine-tuning?",
        answer:
          "Default to RAG when knowledge changes frequently, when answer provenance matters, or when data residency rules forbid model retraining. Fine-tune when behaviour — not knowledge — needs to change.",
      },
      {
        question: "Can RAG run fully on private infrastructure?",
        answer:
          "Yes. We deploy RAG stacks on customer VPCs and on-prem clusters with open-weight models when residency or sovereignty is required, accepting the operational trade-offs explicitly.",
      },
      {
        question: "How do you measure answer quality?",
        answer:
          "A combination of deterministic checks (citation presence, schema conformance) and LLM-judged faithfulness and relevance against a versioned gold set, with a human review queue for high-impact domains.",
      },
    ],
    cta: {
      title: "Planning a RAG rollout?",
      body: "Share the use case and constraints. We'll come back with a reference design, an evaluation plan, and an indicative cost envelope.",
    },
  },
  {
    slug: "cloud-cost-discipline-without-slowing-engineering",
    path: "/technologies/insights/cloud-cost-discipline-without-slowing-engineering",
    category: "cloud",
    tags: ["FinOps", "Cloud", "Cost Optimization"],
    title: "Cloud cost discipline without slowing engineering down",
    metaTitle: "FinOps for engineering teams: cloud cost discipline | HIGAET",
    metaDescription:
      "A pragmatic FinOps approach HIGAET Technologies applies to keep cloud spend predictable without bottlenecking delivery teams.",
    excerpt:
      "Most cloud-cost programs fail because they treat engineers as the problem. Here is the operating model we use instead.",
    publishedAt: "2026-05-18",
    readingMinutes: 9,
    featured: true,
    author: TEAM_PLATFORM,
    executiveSummary:
      "Cloud cost is a product of architecture, defaults, and feedback loops. We share the FinOps operating model HIGAET applies to keep multi-cloud spend predictable while keeping engineering velocity intact.",
    sections: [
      {
        id: "why-programs-fail",
        heading: "Why most cost programs stall",
        body: [
          "Cost programs led purely by finance get one round of cuts, then quietly erode. Programs led purely by engineering optimise the wrong workloads. The functional model is shared accountability with clear unit economics.",
        ],
      },
      {
        id: "make-cost-visible",
        heading: "Make cost visible in the same place work happens",
        body: [
          "Engineers respond to feedback loops they actually see. We push per-environment, per-service spend into the same dashboards teams already use for reliability — not a separate FinOps portal that nobody opens.",
        ],
        bullets: [
          "Tagging standard enforced at provisioning, not in clean-up sweeps",
          "Per-service unit cost (request, tenant, transaction) as a first-class SLO",
          "Cost diffs surfaced on every infrastructure pull request",
        ],
      },
      {
        id: "architectural-levers",
        heading: "Architectural levers that pay back",
        body: [
          "The largest savings come from architecture, not coupon codes. Right-sized compute, autoscaling that actually scales to zero, storage tiering, and ruthless data-egress design routinely outperform reserved-instance arbitrage.",
        ],
      },
      {
        id: "governance",
        heading: "Lightweight governance",
        body: [
          "We avoid heavy approval gates. Instead, budgets, anomaly alerts, and policy-as-code guardrails catch the 5% of decisions that matter without slowing the 95% that do not.",
        ],
      },
    ],
    relatedServiceSlugs: ["cloud-solutions", "cloud-migration", "devops"],
    relatedTechnologySlugs: ["aws", "azure", "gcp", "kubernetes"],
    relatedIndustrySlugs: ["enterprise", "fintech", "retail"],
    relatedCaseStudySlugs: ["retail-omnichannel-saas-platform", "logistics-iot-realtime-tracking"],
    faqs: [
      {
        question: "Do we need a dedicated FinOps team to start?",
        answer:
          "No. A small cross-functional working group — one engineering lead, one finance partner, one platform engineer — is enough to install the first round of visibility and guardrails.",
      },
      {
        question: "Which cloud is cheapest?",
        answer:
          "None, in steady state. List prices converge; the cost difference between clouds is dominated by how you architect on top of them and how you negotiate commitments.",
      },
    ],
    cta: {
      title: "Want a cloud-cost baseline?",
      body: "We'll run a focused assessment, return a prioritised savings backlog, and ship the highest-impact changes with your team.",
    },
  },
  {
    slug: "secure-software-delivery-in-regulated-environments",
    path: "/technologies/insights/secure-software-delivery-in-regulated-environments",
    category: "cybersecurity",
    tags: ["DevSecOps", "Compliance", "SSDLC"],
    title: "Secure software delivery in regulated environments",
    metaTitle: "DevSecOps for regulated industries — SSDLC done right | HIGAET",
    metaDescription:
      "A field guide to building a secure software development lifecycle that holds up to audit, without crushing delivery throughput.",
    excerpt:
      "Compliance is not a stage gate; it is a property of the delivery pipeline. Here is how we engineer it in.",
    publishedAt: "2026-05-04",
    readingMinutes: 10,
    author: TEAM_PLATFORM,
    executiveSummary:
      "Regulated buyers want evidence, not promises. We outline the SSDLC controls, automation, and audit artefacts HIGAET builds into delivery pipelines for finance, healthcare, and public sector clients.",
    sections: [
      {
        id: "shift-left-properly",
        heading: "Shift-left, but mean it",
        body: [
          "'Shift-left' often becomes 'add a scanner'. The real work is making the secure path the easy path: pre-approved base images, hardened scaffolds, secret-aware editors, and pull-request feedback that points to the fix, not just the finding.",
        ],
      },
      {
        id: "supply-chain",
        heading: "Software supply chain",
        body: [
          "SBOMs, signed artefacts, reproducible builds, and dependency provenance are now table stakes. We integrate them into the pipeline output, not as a separate audit ritual.",
        ],
        bullets: [
          "SBOM generated and signed at build time",
          "Container provenance attested and verified at admission",
          "Dependency updates automated with policy-driven gating",
        ],
      },
      {
        id: "audit-ready",
        heading: "Audit-ready by construction",
        body: [
          "Auditors do not want screenshots. They want immutable evidence: who approved what, when, against which control. We wire control evidence into the pipeline so it is generated as a side effect of normal delivery.",
        ],
      },
      {
        id: "people",
        heading: "People and rituals",
        body: [
          "Tools without rituals decay. Threat modelling on new services, security champions inside delivery squads, and quarterly tabletop exercises keep the system alive between audits.",
        ],
      },
    ],
    relatedServiceSlugs: ["devops", "enterprise-software", "it-consulting"],
    relatedTechnologySlugs: ["docker", "kubernetes", "aws", "azure"],
    relatedIndustrySlugs: ["banking", "healthcare", "government"],
    relatedCaseStudySlugs: ["global-fintech-payments-modernization", "healthcare-ai-clinical-copilot"],
    faqs: [
      {
        question: "Does this slow delivery down?",
        answer:
          "Done well, the opposite. Teams with mature DevSecOps practices spend less time on remediation and audit theatre, and ship more confidently into production.",
      },
      {
        question: "Which frameworks do you align with?",
        answer:
          "We map controls to the framework the client is audited against — most commonly SOC 2, ISO 27001, HIPAA, PCI-DSS, RBI cybersecurity guidelines, and DPDP — rather than inventing our own.",
      },
    ],
    cta: {
      title: "Preparing for an audit cycle?",
      body: "We can baseline your SSDLC, close the gaps that move the needle, and leave your team owning the controls.",
    },
  },
  {
    slug: "modernising-legacy-monoliths-without-a-rewrite",
    path: "/technologies/insights/modernising-legacy-monoliths-without-a-rewrite",
    category: "enterprise-architecture",
    tags: ["Modernization", "Strangler Fig", "Architecture"],
    title: "Modernising legacy monoliths without a rewrite",
    metaTitle: "Legacy modernization without a rewrite | HIGAET Technologies",
    metaDescription:
      "How HIGAET incrementally modernises enterprise monoliths using the strangler-fig pattern, contract-first APIs, and disciplined seam work.",
    excerpt:
      "Big-bang rewrites are how legacy systems become legacy projects. We describe the incremental approach that actually finishes.",
    publishedAt: "2026-04-22",
    readingMinutes: 12,
    author: TEAM_EDITORIAL,
    executiveSummary:
      "Most legacy-modernization programs underestimate domain complexity and overestimate rewrite throughput. HIGAET applies a strangler-fig approach with contract-first APIs, behavioural parity testing, and tight executive feedback loops.",
    sections: [
      {
        id: "rewrites-fail",
        heading: "Why rewrites fail",
        body: [
          "A multi-year rewrite competes against an installed base that keeps shipping. Business priorities move; the rewrite does not. By the time it lands — if it lands — it is already legacy in a new language.",
        ],
      },
      {
        id: "find-the-seams",
        heading: "Find the seams",
        body: [
          "Every monolith has seams: bounded contexts hiding inside the schema, batch jobs that own a domain, screens that are de-facto microservices already. Modernization begins by mapping them and prioritising by business risk and change-frequency.",
        ],
      },
      {
        id: "strangler-fig",
        heading: "Strangler-fig, in practice",
        body: [
          "We introduce a façade in front of the monolith, route specific capabilities to new services as they ship, and keep behavioural parity tests running against both. The monolith shrinks; nothing big-bangs.",
        ],
        bullets: [
          "Contract-first API design with versioning from day one",
          "Dual-write or change-data-capture for the data backbone",
          "Behavioural parity testing on real (anonymised) traffic",
          "Decommission criteria defined before extraction, not after",
        ],
      },
      {
        id: "exec-buyin",
        heading: "Keeping executives bought in",
        body: [
          "Multi-year programs die when they stop producing visible business value. We sequence work so a measurable outcome — cost, speed, compliance — lands every quarter, not at the end.",
        ],
      },
    ],
    relatedServiceSlugs: ["legacy-modernization", "enterprise-software", "system-integration"],
    relatedTechnologySlugs: ["java", "spring-boot", "nodejs", "postgresql"],
    relatedIndustrySlugs: ["banking", "manufacturing", "government"],
    relatedCaseStudySlugs: ["global-fintech-payments-modernization", "manufacturing-smart-factory-ai-quality"],
    faqs: [
      {
        question: "How long does a modernization program take?",
        answer:
          "It depends on the surface area, but we plan for value to ship every quarter. The full strangle usually takes 18–36 months for substantial enterprise estates.",
      },
      {
        question: "Do we need to freeze the monolith?",
        answer:
          "No. The monolith continues to ship while modernization runs in parallel. Freezing it is usually a sign the program is being run as a rewrite, not a strangle.",
      },
    ],
    cta: {
      title: "Inherited a monolith?",
      body: "We'll baseline the system, identify the highest-leverage seams, and ship the first extraction with your team.",
    },
  },
  {
    slug: "data-platforms-that-survive-reorgs",
    path: "/technologies/insights/data-platforms-that-survive-reorgs",
    category: "data-engineering",
    tags: ["Data Platform", "Lakehouse", "Governance"],
    title: "Data platforms that survive reorgs",
    metaTitle: "Building durable enterprise data platforms | HIGAET",
    metaDescription:
      "Patterns HIGAET uses to design enterprise data platforms that survive organisational change, vendor churn, and shifting analytical priorities.",
    excerpt:
      "Most data platforms are built for a 12-month roadmap and a 5-year org chart. We invert that.",
    publishedAt: "2026-04-08",
    readingMinutes: 10,
    author: TEAM_PLATFORM,
    executiveSummary:
      "A durable data platform separates storage, compute, semantics, and access. HIGAET designs platforms whose components can be swapped independently, so reorgs and tool migrations stop being existential events.",
    sections: [
      {
        id: "separation",
        heading: "Separate storage, compute, semantics, and access",
        body: [
          "Coupling these four layers is how data platforms become single-vendor lock-ins. Decoupling them lets you change one without rebuilding the others.",
        ],
      },
      {
        id: "semantic-layer",
        heading: "The semantic layer is the product",
        body: [
          "Business logic that lives only in dashboards is invisible to the next team. A versioned, tested semantic layer is the unit of reuse — and the surface that AI agents will increasingly query.",
        ],
      },
      {
        id: "governance",
        heading: "Governance that does not block delivery",
        body: [
          "Catalogue, lineage, and data-contract enforcement should be by-products of the pipeline, not extra work after the fact. We treat data contracts the same way we treat API contracts.",
        ],
        bullets: [
          "Data contracts on every producer-to-consumer interface",
          "Lineage captured by the orchestrator, not by humans",
          "Access decisions evaluated centrally, enforced at the engine",
        ],
      },
      {
        id: "ai-readiness",
        heading: "AI-readiness, in passing",
        body: [
          "An AI strategy without a data strategy is a slide deck. A well-built platform makes RAG, ML, and analytics workloads the same kind of citizen — three consumers of the same governed surface.",
        ],
      },
    ],
    relatedServiceSlugs: ["data-engineering", "business-intelligence", "ai-solutions"],
    relatedTechnologySlugs: ["python", "postgresql", "aws", "data-engineering-tech"],
    relatedIndustrySlugs: ["retail", "fintech", "healthcare"],
    relatedCaseStudySlugs: ["retail-omnichannel-saas-platform", "logistics-iot-realtime-tracking"],
    faqs: [
      {
        question: "Lakehouse or warehouse?",
        answer:
          "The question is increasingly architectural rather than product. We choose engines by workload shape, not vendor narrative, and design so the engine can change.",
      },
      {
        question: "How do we measure platform success?",
        answer:
          "Time-to-trustworthy-answer for a new question, cost per analytical workload, and the number of decisions made directly off platform data — not dashboard counts.",
      },
    ],
    cta: {
      title: "Re-platforming your data stack?",
      body: "We'll review the current state, recommend a target architecture, and migrate the first domain with you.",
    },
  },
  {
    slug: "designing-enterprise-saas-for-multi-tenant-reality",
    path: "/technologies/insights/designing-enterprise-saas-for-multi-tenant-reality",
    category: "saas",
    tags: ["SaaS", "Multi-tenant", "Enterprise"],
    title: "Designing enterprise SaaS for multi-tenant reality",
    metaTitle: "Enterprise SaaS multi-tenancy: patterns that scale | HIGAET",
    metaDescription:
      "Practical multi-tenancy patterns HIGAET uses to ship enterprise SaaS that meets isolation, customisation, and residency requirements at scale.",
    excerpt:
      "Enterprise buyers want SaaS economics with on-prem guarantees. The architecture has to do real work.",
    publishedAt: "2026-03-21",
    readingMinutes: 9,
    author: TEAM_EDITORIAL,
    executiveSummary:
      "Multi-tenant SaaS for enterprise requires more than a tenant_id column. HIGAET shares the isolation models, customisation strategies, and residency patterns we apply across our SaaS engagements.",
    sections: [
      {
        id: "isolation-models",
        heading: "Pick the right isolation model per layer",
        body: [
          "Pool-vs-silo is rarely a single decision. Identity, storage, compute, and observability often want different answers, and the right model can change by tier.",
        ],
        bullets: [
          "Identity: per-tenant SSO and IdP federation by default",
          "Data: pooled with row-level security at the platform tier, silo for regulated tiers",
          "Compute: pooled with noisy-neighbour controls, dedicated runners for enterprise tier",
          "Observability: per-tenant logs and metrics, never shared dashboards",
        ],
      },
      {
        id: "customisation",
        heading: "Customisation without per-customer branches",
        body: [
          "Every per-customer code branch is a future migration tax. Configuration, extension points, and tenant-scoped plugins keep the codebase singular while letting buyers feel served.",
        ],
      },
      {
        id: "residency",
        heading: "Data residency and sovereignty",
        body: [
          "Residency is a regional deployment problem, not a database setting. We design for it from the start — control plane global, data plane regional — to avoid the rewrite later.",
        ],
      },
    ],
    relatedServiceSlugs: ["saas-products", "enterprise-software", "cloud-solutions"],
    relatedTechnologySlugs: ["nodejs", "postgresql", "aws", "kubernetes"],
    relatedIndustrySlugs: ["enterprise", "fintech", "healthcare"],
    relatedCaseStudySlugs: ["retail-omnichannel-saas-platform", "edtech-learning-platform-scale"],
    faqs: [
      {
        question: "Should we start pooled or silo?",
        answer:
          "Start pooled with strong tenant isolation primitives. Silo only the tiers and regions that genuinely require it. Reversing the choice later is much easier in this direction.",
      },
      {
        question: "How do we price multi-tenant tiers?",
        answer:
          "Tie pricing to the isolation, residency, and support guarantees the architecture actually enforces. Decoupling commercial tiers from technical guarantees creates margin leakage.",
      },
    ],
    cta: {
      title: "Building a SaaS for enterprise buyers?",
      body: "We'll review your tenancy model, identify the risks, and help you ship a deployment topology that holds at scale.",
    },
  },
];

export const INSIGHTS_BY_SLUG: Record<string, InsightContent> = Object.fromEntries(
  INSIGHTS.map((i) => [i.slug, i]),
);

export function getInsight(slug: string): InsightContent | undefined {
  return INSIGHTS_BY_SLUG[slug];
}

export function listInsightsByCategory(category?: InsightCategory): InsightContent[] {
  if (!category) return INSIGHTS;
  return INSIGHTS.filter((i) => i.category === category);
}

export function listInsightsByTag(tag: string): InsightContent[] {
  const needle = tag.toLowerCase();
  return INSIGHTS.filter((i) => i.tags.some((t) => t.toLowerCase() === needle));
}

export function relatedInsights(slug: string, n = 3): InsightContent[] {
  const current = INSIGHTS_BY_SLUG[slug];
  if (!current) return [];
  return INSIGHTS.filter((i) => i.slug !== slug)
    .map((i) => ({
      insight: i,
      score:
        (i.category === current.category ? 3 : 0) +
        i.tags.filter((t) => current.tags.includes(t)).length,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map((r) => r.insight);
}

export const INSIGHT_TAGS: string[] = Array.from(
  new Set(INSIGHTS.flatMap((i) => i.tags)),
).sort((a, b) => a.localeCompare(b));

export const INSIGHT_CATEGORIES: InsightCategory[] = Array.from(
  new Set(INSIGHTS.map((i) => i.category)),
);
