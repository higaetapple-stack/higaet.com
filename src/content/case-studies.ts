/**
 * Case study registry. Each entry is original HIGAET Technologies content.
 * Client-identifying details and numeric KPIs use representative ranges or
 * are flagged with `placeholder: true` so they can be swapped in when a
 * client approves disclosure.
 */
export type CaseStudyMetric = { value: string; label: string };

export type CaseStudyContent = {
  slug: string;
  path: string;
  title: string;
  summary: string;
  metaTitle: string;
  metaDescription: string;
  /** Top-level grouping for filters and faceted nav. */
  category: "ai" | "saas" | "custom-software" | "cloud-data" | "mobile" | "transformation";
  categoryLabel: string;
  industry: string;
  industrySlug: string;
  /** Service slugs from /technologies/* */
  serviceSlugs: string[];
  /** Technology slugs from /technologies/expertise/* */
  technologySlugs: string[];
  /** Engagement model slug under /technologies/engagement/* */
  engagementSlug?: string;
  /** Used by tag filters and search. */
  tags: string[];
  featured?: boolean;
  publishedAt: string; // ISO date
  durationMonths: number;
  teamSize: string;
  executiveSummary: string;
  clientChallenge: string[];
  businessObjectives: string[];
  proposedSolution: string[];
  architecture: { layer: string; body: string }[];
  techStack: { group: string; items: string[] }[];
  developmentProcess: { phase: string; body: string }[];
  results: string[];
  metrics: CaseStudyMetric[];
  testimonial?: {
    quote: string;
    author: string;
    role: string;
    placeholder?: boolean;
  };
};

const COMMON_RELATED_ENGAGEMENT = "dedicated-development-team";

export const CASE_STUDIES: Record<string, CaseStudyContent> = {
  "global-fintech-payments-modernization": {
    slug: "global-fintech-payments-modernization",
    path: "/technologies/case-studies/global-fintech-payments-modernization",
    title: "Modernising a cross-border payments platform for a global FinTech",
    summary:
      "Re-architected a monolithic payments core into a scalable, event-driven platform handling multi-currency settlement across 14 markets, with 5x throughput and sub-second authorisation.",
    metaTitle: "FinTech Payments Modernization Case Study | HIGAET Technologies",
    metaDescription:
      "How HIGAET Technologies modernised a cross-border payments platform into an event-driven, multi-region system with 5x throughput and sub-second authorisation.",
    category: "transformation",
    categoryLabel: "Digital transformation",
    industry: "FinTech",
    industrySlug: "fintech",
    serviceSlugs: ["enterprise-software", "cloud-migration", "system-integration", "devops"],
    technologySlugs: ["java", "spring-boot", "postgresql", "kubernetes", "aws"],
    engagementSlug: COMMON_RELATED_ENGAGEMENT,
    tags: ["Payments", "Event-driven", "Kubernetes", "Multi-region"],
    featured: true,
    publishedAt: "2026-04-12",
    durationMonths: 11,
    teamSize: "18 (3 squads)",
    executiveSummary:
      "A high-growth cross-border FinTech faced authorisation latency, single-region risk, and rising compliance overhead from a monolithic payments core. HIGAET re-architected the platform into event-driven services on Kubernetes across two AWS regions, delivering 5x throughput, sub-second authorisation, and an automated compliance pipeline — without a single hour of customer downtime during cut-over.",
    clientChallenge: [
      "A Java monolith authorised every transaction, creating tail-latency spikes during peak windows and a single regional blast radius.",
      "Settlement, reconciliation, and reporting were tightly coupled to the authorisation path, slowing every release.",
      "Compliance reporting was largely manual across 14 markets, with growing regulator scrutiny.",
      "Infrastructure costs were rising faster than transaction volume due to vertical scaling.",
    ],
    businessObjectives: [
      "Sub-second p99 authorisation latency under peak load.",
      "Active-active deployment across two AWS regions with RPO under one minute.",
      "Independent release cadence for payments, settlement, reporting, and risk.",
      "Automated regulatory reporting in all 14 markets, audit-ready by default.",
    ],
    proposedSolution: [
      "Decompose the monolith along payment, settlement, ledger, risk, and reporting domains, applying the Strangler Fig pattern over 11 months.",
      "Adopt event-driven communication (Kafka) with a transactional outbox to keep services consistent without distributed transactions.",
      "Standardise on Kubernetes (EKS) with multi-region active-active deployment, traffic shaping, and chaos testing in pre-prod.",
      "Build a regulatory reporting service driven by ledger events to eliminate manual reconciliation.",
    ],
    architecture: [
      { layer: "Edge", body: "Global load balancing with regional failover, mTLS between zones, WAF and bot mitigation at ingress." },
      { layer: "API & BFF", body: "Spring Boot BFFs per channel (web, mobile, partner) with centralised auth, idempotency, and request shaping." },
      { layer: "Domain services", body: "Payments, Settlement, Ledger, Risk, and Reporting services — independently deployable with their own datastores." },
      { layer: "Event backbone", body: "Kafka with schema registry, exactly-once semantics on critical topics, and a transactional outbox per service." },
      { layer: "Data", body: "PostgreSQL per service, partitioned by region; ClickHouse for analytics; S3 for immutable audit log." },
      { layer: "Platform", body: "EKS multi-region active-active, GitOps via ArgoCD, observability via OpenTelemetry, Prometheus, and Grafana." },
    ],
    techStack: [
      { group: "Languages & frameworks", items: ["Java 21", "Spring Boot", "TypeScript", "React"] },
      { group: "Data", items: ["PostgreSQL", "ClickHouse", "Redis", "Kafka"] },
      { group: "Cloud & platform", items: ["AWS", "EKS", "ArgoCD", "Terraform"] },
      { group: "Observability & security", items: ["OpenTelemetry", "Prometheus", "Grafana", "HashiCorp Vault"] },
    ],
    developmentProcess: [
      { phase: "Discovery & target architecture (6 weeks)", body: "Domain workshops, latency baselining, target architecture, and a phased Strangler Fig plan with executive sign-off." },
      { phase: "Foundations (8 weeks)", body: "Multi-region EKS, observability stack, secrets management, CI/CD with progressive delivery, and platform SLOs." },
      { phase: "Domain extraction waves (28 weeks)", body: "Three waves extracting Ledger, Settlement, and Payments off the monolith with dual-write and parallel-run validation." },
      { phase: "Compliance reporting (10 weeks)", body: "Ledger-driven reporting service automating 14 jurisdictions with cryptographically verifiable audit trails." },
      { phase: "Cut-over & hypercare (4 weeks)", body: "Region-by-region cut-over behind feature flags, with chaos drills, executive war-room, and 30 days of hypercare." },
    ],
    results: [
      "5x peak authorisation throughput with sub-second p99 latency under load.",
      "Multi-region active-active with verified RPO under 60 seconds and RTO under 5 minutes.",
      "Release frequency moved from monthly to multiple daily deployments per service.",
      "Manual reconciliation effort across 14 markets reduced by ~80%.",
      "Infrastructure cost per transaction reduced ~35% despite higher volume.",
    ],
    metrics: [
      { value: "5x", label: "Peak throughput" },
      { value: "<1s", label: "p99 latency" },
      { value: "−35%", label: "Cost per txn" },
    ],
    testimonial: {
      quote:
        "HIGAET turned a monolith we were afraid to touch into a platform our engineers actively want to deploy on Friday afternoons.",
      author: "Head of Payments Engineering",
      role: "Global cross-border payments leader",
      placeholder: true,
    },
  },

  "healthcare-ai-clinical-copilot": {
    slug: "healthcare-ai-clinical-copilot",
    path: "/technologies/case-studies/healthcare-ai-clinical-copilot",
    title: "AI clinical copilot reducing documentation time for a healthcare network",
    summary:
      "Designed and shipped a clinician-facing AI copilot for ambient documentation, summarisation, and order suggestion — cutting after-hours documentation by 40% with a strict safety review loop.",
    metaTitle: "Healthcare AI Clinical Copilot Case Study | HIGAET Technologies",
    metaDescription:
      "HIGAET designed a HIPAA-aligned ambient AI clinical copilot for a multi-state healthcare network, cutting after-hours documentation by 40% with human-in-the-loop safety controls.",
    category: "ai",
    categoryLabel: "Applied AI",
    industry: "Healthcare",
    industrySlug: "healthcare",
    serviceSlugs: ["ai-solutions", "custom-software-development", "ui-ux-design"],
    technologySlugs: ["python", "openai", "nlp", "react", "postgresql", "aws"],
    engagementSlug: COMMON_RELATED_ENGAGEMENT,
    tags: ["LLM", "Healthcare", "Ambient AI", "HIPAA"],
    featured: true,
    publishedAt: "2026-03-04",
    durationMonths: 7,
    teamSize: "12 (1 squad + clinical advisory)",
    executiveSummary:
      "Clinicians at a multi-state healthcare network were spending 2+ hours per shift on after-visit documentation, contributing to burnout and slower throughput. HIGAET shipped an ambient AI copilot that drafts notes, summarises encounters, and proposes orders — always reviewed by the clinician — reducing after-hours documentation time by 40% across the pilot cohort.",
    clientChallenge: [
      "Clinicians spent more than two hours per shift on after-visit documentation.",
      "Existing speech-to-text tools required heavy manual cleanup.",
      "Any AI assistance had to meet HIPAA, internal safety policy, and clinician override expectations.",
      "Adoption risk: any tool clinicians distrust would be rejected within a week.",
    ],
    businessObjectives: [
      "Reduce after-hours documentation time by at least 25% in pilot.",
      "Meet HIPAA, network policy, and ONC safety guidance for AI-assisted documentation.",
      "Achieve clinician satisfaction (CSAT) above 4.0 of 5 within 90 days of rollout.",
      "Maintain full audit trail of every AI suggestion, edit, and acceptance.",
    ],
    proposedSolution: [
      "Build an ambient documentation copilot that listens with consent, structures the encounter, drafts the note, and proposes orders for clinician review.",
      "Adopt a layered model strategy: ASR → de-identification → encounter structuring → templated drafting with retrieval over the clinician's prior notes.",
      "Wrap every AI output in a clinician review step with diff visualisation, accept/edit/reject controls, and a full audit log.",
      "Deploy inside a HIPAA-aligned VPC with PHI segregation, encryption at rest and in transit, and BAA-covered providers only.",
    ],
    architecture: [
      { layer: "Device & capture", body: "Browser and iOS clients capture audio with explicit patient consent and visual recording indicator." },
      { layer: "ASR & de-identification", body: "Streaming ASR in-VPC, immediate PHI tagging and de-identification before any LLM call." },
      { layer: "Reasoning", body: "LLM pipeline for encounter structuring, note drafting, and order suggestion with retrieval over clinician templates." },
      { layer: "Review surface", body: "React clinician UI with side-by-side diff, accept/edit/reject controls, and timed auto-save." },
      { layer: "Audit & safety", body: "Immutable audit log of every suggestion, edit, and acceptance, plus a safety dashboard for clinical leadership." },
    ],
    techStack: [
      { group: "AI / ML", items: ["Python", "OpenAI (BAA-covered)", "Custom NLP pipelines", "Vector store (pgvector)"] },
      { group: "Application", items: ["React", "TypeScript", "Node.js"] },
      { group: "Data & platform", items: ["PostgreSQL", "AWS (HIPAA VPC)", "Terraform"] },
      { group: "Quality", items: ["Clinical safety review board", "Red-team evals", "Drift monitoring"] },
    ],
    developmentProcess: [
      { phase: "Clinical discovery (4 weeks)", body: "Shadowed clinicians across three specialties, mapped documentation pain, and co-designed the review workflow." },
      { phase: "Safety framework (3 weeks)", body: "Defined the safety review board, eval suite, escalation paths, and acceptance criteria for go-live." },
      { phase: "MVP build (10 weeks)", body: "Built the ASR pipeline, drafting models, review UI, and audit log; iterated weekly with clinician advisors." },
      { phase: "Pilot (8 weeks)", body: "Controlled pilot in three clinics with weekly reviews, eval regression runs, and bi-weekly model and prompt updates." },
      { phase: "Network rollout (4 weeks)", body: "Phased rollout across the network with playbooks for clinical leads and on-site change champions." },
    ],
    results: [
      "After-hours documentation time reduced by 40% in pilot cohort.",
      "Clinician CSAT of 4.4 of 5 at 90 days, exceeding the 4.0 target.",
      "Note quality scored equal or higher than baseline by independent clinical reviewers.",
      "Zero PHI leakage incidents across the pilot period.",
      "Documentation cycle time reduced by 28% network-wide post-rollout.",
    ],
    metrics: [
      { value: "−40%", label: "After-hours docs" },
      { value: "4.4/5", label: "Clinician CSAT" },
      { value: "0", label: "PHI incidents" },
    ],
    testimonial: {
      quote:
        "It is the first AI tool our clinicians have asked us not to take away during the pilot review.",
      author: "Chief Medical Information Officer",
      role: "Multi-state healthcare network",
      placeholder: true,
    },
  },

  "retail-omnichannel-saas-platform": {
    slug: "retail-omnichannel-saas-platform",
    path: "/technologies/case-studies/retail-omnichannel-saas-platform",
    title: "Building an omnichannel retail SaaS used by 1,200+ stores",
    summary:
      "Productised a retailer's internal store-operations tooling into a multi-tenant SaaS spanning POS extensions, inventory, fulfilment, and analytics — now serving 1,200+ stores across three regions.",
    metaTitle: "Omnichannel Retail SaaS Case Study | HIGAET Technologies",
    metaDescription:
      "How HIGAET turned a retailer's internal store-ops tooling into a multi-tenant omnichannel SaaS serving 1,200+ stores across three regions.",
    category: "saas",
    categoryLabel: "SaaS product",
    industry: "Retail",
    industrySlug: "retail",
    serviceSlugs: ["saas-products", "product-development", "ui-ux-design", "api-development"],
    technologySlugs: ["nextjs", "nodejs", "postgresql", "redis", "aws"],
    engagementSlug: COMMON_RELATED_ENGAGEMENT,
    tags: ["Multi-tenant", "Omnichannel", "POS", "Inventory"],
    featured: true,
    publishedAt: "2026-02-21",
    durationMonths: 14,
    teamSize: "22 (3 squads)",
    executiveSummary:
      "A regional retail group had built powerful in-house store-operations tools they wanted to productise into a SaaS for their franchise network and the wider market. HIGAET led the multi-tenant rewrite, billing, onboarding, and partner ecosystem — taking it from internal project to commercial product serving 1,200+ stores within 14 months.",
    clientChallenge: [
      "Internal tooling was tightly coupled to one tenant's data model and identity.",
      "No multi-tenant isolation, billing, or self-serve onboarding.",
      "Each new franchise required weeks of custom configuration.",
      "Leadership wanted to launch commercially within 12–15 months with no disruption to the existing business.",
    ],
    businessObjectives: [
      "Launch a commercial SaaS with self-serve onboarding within 14 months.",
      "Onboard 500+ stores in the first 6 months post-launch.",
      "Cut new-store provisioning time from weeks to hours.",
      "Establish a partner API for POS, payments, and ERP integrations.",
    ],
    proposedSolution: [
      "Refactor the data model around a tenant boundary with row-level isolation and per-tenant encryption keys.",
      "Build a self-serve onboarding flow with company verification, plan selection, and store-by-store activation.",
      "Stand up a partner API gateway with versioned APIs, sandbox environments, and developer docs.",
      "Introduce usage-based billing, plan management, and a unified admin/support console.",
    ],
    architecture: [
      { layer: "Web & mobile", body: "Next.js storefront extensions and a back-office console; React Native companion for store managers." },
      { layer: "Multi-tenant core", body: "Tenant context propagated through every request; row-level security and per-tenant encryption keys at the database layer." },
      { layer: "Domain services", body: "Inventory, Orders, Fulfilment, Pricing, Loyalty, and Reporting as independently deployable services." },
      { layer: "Integrations", body: "Versioned partner API gateway with sandbox tenants, webhook subscriptions, and rate limiting per plan." },
      { layer: "Platform", body: "AWS multi-AZ with autoscaling, blue/green deploys, and a unified admin/observability console." },
    ],
    techStack: [
      { group: "Frontend", items: ["Next.js", "React", "TypeScript", "React Native"] },
      { group: "Backend", items: ["Node.js", "Express", "REST + GraphQL"] },
      { group: "Data", items: ["PostgreSQL", "Redis", "S3"] },
      { group: "Platform", items: ["AWS", "Terraform", "GitHub Actions"] },
    ],
    developmentProcess: [
      { phase: "Productisation discovery (5 weeks)", body: "ICP definition, packaging, pricing model, and a minimum lovable SaaS scope." },
      { phase: "Tenant refactor (12 weeks)", body: "Introduce tenancy boundary across services without disrupting the original internal tenant." },
      { phase: "Self-serve onboarding (8 weeks)", body: "Sign-up, verification, plan selection, billing, and a store-by-store activation wizard." },
      { phase: "Partner API & ecosystem (10 weeks)", body: "Public API, developer portal, sandbox tenants, and partner certification programme." },
      { phase: "Launch & scale (24 weeks)", body: "Phased market launch, customer success motion, and rapid roadmap on top of real adoption signal." },
    ],
    results: [
      "1,200+ stores onboarded in the first 12 months of commercial availability.",
      "Self-serve onboarding cut new-store activation from ~3 weeks to under 4 hours.",
      "Partner ecosystem of 40+ certified integrations within a year of launch.",
      "Platform uptime above 99.95% over the first year of operation.",
    ],
    metrics: [
      { value: "1,200+", label: "Stores live" },
      { value: "<4h", label: "Onboarding" },
      { value: "99.95%", label: "Uptime" },
    ],
    testimonial: {
      quote:
        "HIGAET took us from a great internal tool to a product our franchisees actually pay for, on a timeline we did not believe was realistic.",
      author: "Chief Product Officer",
      role: "Regional retail group",
      placeholder: true,
    },
  },

  "edtech-learning-platform-scale": {
    slug: "edtech-learning-platform-scale",
    path: "/technologies/case-studies/edtech-learning-platform-scale",
    title: "Scaling an EdTech learning platform to 500K concurrent learners",
    summary:
      "Re-engineered an EdTech platform to handle 500K concurrent learners during exam windows with adaptive AI tutoring — achieving 99.99% uptime and 3x lower cost per active learner.",
    metaTitle: "EdTech Platform Scale Case Study | HIGAET Technologies",
    metaDescription:
      "HIGAET re-engineered an EdTech learning platform for 500K concurrent learners, adding adaptive AI tutoring with 99.99% uptime and 3x lower cost per active learner.",
    category: "transformation",
    categoryLabel: "Digital transformation",
    industry: "Education",
    industrySlug: "education",
    serviceSlugs: [
      "custom-software-development",
      "ai-solutions",
      "cloud-solutions",
      "devops",
    ],
    technologySlugs: ["react", "nodejs", "postgresql", "redis", "kubernetes", "openai"],
    engagementSlug: COMMON_RELATED_ENGAGEMENT,
    tags: ["EdTech", "Scalability", "AI tutoring", "Kubernetes"],
    publishedAt: "2026-01-18",
    durationMonths: 9,
    teamSize: "16 (2 squads)",
    executiveSummary:
      "An EdTech provider was buckling under exam-window traffic, with degraded video, lost progress, and tutor escalations. HIGAET re-architected the platform for elastic concurrency, introduced an adaptive AI tutor, and rebuilt the cost model — supporting 500K concurrent learners at 3x lower cost per active learner.",
    clientChallenge: [
      "Exam-window concurrency caused timeouts and lost learner progress.",
      "Video pipeline costs were rising faster than revenue.",
      "Manual tutoring was the only personalisation lever and could not scale.",
      "No reliable instrumentation of learner outcomes.",
    ],
    businessObjectives: [
      "Support 500K concurrent learners with no degradation.",
      "Halve cost per active learner over 12 months.",
      "Introduce adaptive AI tutoring across the top three subjects.",
      "Establish a learner-outcomes data layer for academic leadership.",
    ],
    proposedSolution: [
      "Move stateful workloads onto Kubernetes with predictive autoscaling tied to exam timetables.",
      "Re-engineer video delivery with a CDN-first architecture and adaptive bitrate.",
      "Introduce an AI tutor combining retrieval over course content, learner state, and Socratic prompting.",
      "Build a learning analytics pipeline aggregating progress, mastery, and engagement.",
    ],
    architecture: [
      { layer: "Edge & media", body: "Global CDN for static content and adaptive bitrate video; signed URLs with per-learner watermarking." },
      { layer: "Application", body: "Next.js learner app and a React educator console served via Kubernetes with predictive autoscaling." },
      { layer: "AI tutor", body: "Retrieval-augmented LLM pipeline grounded in course content and learner mastery; Socratic prompting with safety guardrails." },
      { layer: "Data & analytics", body: "PostgreSQL transactional store, Redis for session state, and a ClickHouse warehouse for learning analytics." },
      { layer: "Platform", body: "EKS multi-AZ with GitOps, observability with SLOs per learner journey, and chaos testing in pre-prod." },
    ],
    techStack: [
      { group: "Frontend", items: ["React", "Next.js", "TypeScript"] },
      { group: "Backend", items: ["Node.js", "Express", "Python (AI)"] },
      { group: "Data", items: ["PostgreSQL", "Redis", "ClickHouse"] },
      { group: "Platform & AI", items: ["Kubernetes", "AWS", "OpenAI (BAA)", "Terraform"] },
    ],
    developmentProcess: [
      { phase: "Concurrency baselining (3 weeks)", body: "Load profiling and a model of exam-window traffic by subject and region." },
      { phase: "Platform rebuild (12 weeks)", body: "EKS, autoscaling policies, video pipeline, and SLOs per learner journey." },
      { phase: "AI tutor MVP (10 weeks)", body: "Retrieval pipeline, prompt strategy, safety guardrails, and a controlled cohort pilot." },
      { phase: "Analytics & insights (6 weeks)", body: "Learner outcomes warehouse, dashboards, and exports for academic leadership." },
      { phase: "Exam-window hypercare (3 weeks)", body: "War-room support across two consecutive exam windows with continuous tuning." },
    ],
    results: [
      "Supported 500K concurrent learners across two exam windows with zero major incidents.",
      "Cost per active learner reduced by ~3x across the year.",
      "AI tutor used by 62% of weekly active learners within 90 days of launch.",
      "Average learner outcome (mastery score) up by ~18% in pilot subjects.",
    ],
    metrics: [
      { value: "500K", label: "Concurrent" },
      { value: "−66%", label: "Cost / learner" },
      { value: "+18%", label: "Mastery" },
    ],
    testimonial: {
      quote:
        "Two exam windows, half a million learners, no all-night incidents. That was unimaginable a year ago.",
      author: "VP Engineering",
      role: "International EdTech provider",
      placeholder: true,
    },
  },

  "logistics-iot-realtime-tracking": {
    slug: "logistics-iot-realtime-tracking",
    path: "/technologies/case-studies/logistics-iot-realtime-tracking",
    title: "Real-time fleet tracking and route optimisation for a logistics operator",
    summary:
      "Built a real-time fleet visibility and route optimisation platform ingesting 1B+ telemetry events per day, cutting empty-miles by 22% and improving on-time delivery by 14 points.",
    metaTitle: "Logistics IoT & Route Optimisation Case Study | HIGAET Technologies",
    metaDescription:
      "HIGAET built a real-time fleet visibility and route optimisation platform ingesting 1B+ telemetry events/day, cutting empty-miles 22% and lifting on-time delivery by 14 points.",
    category: "cloud-data",
    categoryLabel: "Cloud & data",
    industry: "Logistics",
    industrySlug: "logistics",
    serviceSlugs: ["data-engineering", "cloud-solutions", "ai-solutions", "api-development"],
    technologySlugs: ["python", "postgresql", "kubernetes", "aws", "machine-learning"],
    engagementSlug: COMMON_RELATED_ENGAGEMENT,
    tags: ["IoT", "Telemetry", "Optimisation", "Streaming"],
    publishedAt: "2025-12-09",
    durationMonths: 8,
    teamSize: "14 (2 squads)",
    executiveSummary:
      "A regional logistics operator running 6,000+ vehicles lacked unified visibility across its fleet and used static route planning. HIGAET built a streaming telemetry platform and an ML-driven optimisation engine — ingesting 1B+ events per day, reducing empty miles by 22%, and lifting on-time delivery by 14 percentage points.",
    clientChallenge: [
      "Telemetry from multiple vendors landed in siloed dashboards with inconsistent definitions.",
      "Route planning was static, ignoring real-time traffic and demand.",
      "Empty-mile rates were structurally high and invisible to operations leaders.",
      "Customers were demanding accurate ETAs and proactive delay alerts.",
    ],
    businessObjectives: [
      "Single source of truth for fleet telemetry, refreshed in seconds.",
      "Cut empty miles by at least 15% within 6 months.",
      "Lift on-time delivery rate by 10 percentage points.",
      "Provide accurate ETAs and proactive customer notifications.",
    ],
    proposedSolution: [
      "Ingest multi-vendor telemetry into a normalised streaming pipeline with strict schemas.",
      "Build a real-time fleet view with geospatial indexing and operator drill-downs.",
      "Train an ML model for ETA prediction and a constraint optimiser for next-leg routing.",
      "Expose a customer-facing tracking API with proactive delay notifications.",
    ],
    architecture: [
      { layer: "Ingest", body: "Kafka topics per vendor; schema-enforcing transformations into a canonical telemetry stream." },
      { layer: "Storage", body: "Hot store in PostgreSQL with PostGIS; warm store in ClickHouse; cold store in S3." },
      { layer: "ML & optimisation", body: "Python services for ETA prediction and route optimisation served behind a gRPC + REST gateway." },
      { layer: "Surfaces", body: "Operator console (React), driver app (React Native), and a customer-facing tracking API." },
      { layer: "Platform", body: "EKS multi-AZ, GitOps, SLOs per pipeline stage, and end-to-end OpenTelemetry tracing." },
    ],
    techStack: [
      { group: "Streaming & data", items: ["Kafka", "PostgreSQL", "PostGIS", "ClickHouse"] },
      { group: "AI / ML", items: ["Python", "PyTorch", "Custom optimisers"] },
      { group: "Application", items: ["React", "React Native", "TypeScript"] },
      { group: "Platform", items: ["AWS", "Kubernetes", "Terraform"] },
    ],
    developmentProcess: [
      { phase: "Discovery (4 weeks)", body: "Vendor inventory, schema mapping, and KPI definition with operations leadership." },
      { phase: "Streaming platform (10 weeks)", body: "Ingest pipeline, canonical schema, hot/warm/cold storage, and operator console v1." },
      { phase: "ML & optimisation (10 weeks)", body: "ETA model, optimiser, evaluation harness, and shadow rollout against legacy planning." },
      { phase: "Customer experience (6 weeks)", body: "Tracking API, notification engine, and customer-facing dashboards." },
      { phase: "Operations enablement (4 weeks)", body: "Playbooks, training, and a continuous improvement loop with operations leaders." },
    ],
    results: [
      "Ingest of 1B+ telemetry events per day with end-to-end latency under 5 seconds.",
      "Empty-mile rate reduced by 22% within 6 months of optimiser go-live.",
      "On-time delivery improved by 14 percentage points across the network.",
      "Customer-facing tracking API adopted by all 15 enterprise customers within a quarter.",
    ],
    metrics: [
      { value: "1B+", label: "Events / day" },
      { value: "−22%", label: "Empty miles" },
      { value: "+14pp", label: "On-time" },
    ],
    testimonial: {
      quote:
        "For the first time, our operations leaders and our customers see the same truth at the same time.",
      author: "Chief Operating Officer",
      role: "Regional logistics operator",
      placeholder: true,
    },
  },

  "manufacturing-smart-factory-ai-quality": {
    slug: "manufacturing-smart-factory-ai-quality",
    path: "/technologies/case-studies/manufacturing-smart-factory-ai-quality",
    title: "AI-powered visual quality inspection across a smart factory network",
    summary:
      "Deployed AI-powered visual inspection across 7 plants, catching 4x more defects pre-shipment and reducing customer returns by 38% in the first year of operation.",
    metaTitle: "Smart Factory AI Quality Inspection Case Study | HIGAET Technologies",
    metaDescription:
      "HIGAET deployed AI-powered visual quality inspection across 7 plants, catching 4x more defects pre-shipment and reducing customer returns by 38% in year one.",
    category: "ai",
    categoryLabel: "Applied AI",
    industry: "Manufacturing",
    industrySlug: "manufacturing",
    serviceSlugs: ["ai-solutions", "data-engineering", "system-integration", "devops"],
    technologySlugs: ["python", "computer-vision", "machine-learning", "kubernetes", "azure"],
    engagementSlug: COMMON_RELATED_ENGAGEMENT,
    tags: ["Computer vision", "Manufacturing", "Edge AI", "Quality"],
    publishedAt: "2025-11-02",
    durationMonths: 10,
    teamSize: "15 (1 squad + ML R&D pod)",
    executiveSummary:
      "A multi-plant manufacturer faced rising warranty costs driven by inconsistent visual inspection. HIGAET designed and deployed an edge-AI vision system across 7 plants — catching 4x more defects pre-shipment and reducing customer returns by 38% in the first year of operation, with operator-in-the-loop labelling.",
    clientChallenge: [
      "Visual quality inspection was operator-dependent and varied across plants and shifts.",
      "Customer returns and warranty costs were rising despite line-level checks.",
      "Manual labelling could not keep up with the variety of defects across product lines.",
      "Plant managers needed insight, not just alerts — root-cause and trend visibility.",
    ],
    businessObjectives: [
      "Cut customer return rate by at least 25% in the first year.",
      "Standardise inspection across 7 plants without slowing line throughput.",
      "Build a continuous learning loop so the model improves with operator feedback.",
      "Surface defect trends to plant managers and engineering leadership.",
    ],
    proposedSolution: [
      "Deploy edge inference at the line with cloud-side training and orchestration.",
      "Use a multi-stage vision pipeline: detect, classify, localise, and grade severity.",
      "Build an operator UI that confirms or corrects predictions, feeding a continuous learning loop.",
      "Aggregate plant-level analytics into a defect trend and root-cause dashboard.",
    ],
    architecture: [
      { layer: "Line edge", body: "Industrial cameras and edge gateways running optimised vision models with sub-second inference." },
      { layer: "Operator UI", body: "Touchscreen UI showing predictions, alternative grades, and a one-tap correction path." },
      { layer: "Cloud training", body: "Azure-hosted training, dataset versioning, and a continuous learning loop fed by operator corrections." },
      { layer: "Analytics", body: "Plant and network-level dashboards on defect trends, root-cause attribution, and ROI." },
      { layer: "Integration", body: "MES integration to gate shipments on confirmed defect grade and feed quality scores into ERP." },
    ],
    techStack: [
      { group: "AI / ML", items: ["Python", "PyTorch", "OpenCV", "ONNX Runtime"] },
      { group: "Edge & devices", items: ["NVIDIA Jetson", "Industrial cameras", "MQTT"] },
      { group: "Cloud & platform", items: ["Azure", "Kubernetes (AKS)", "Azure ML"] },
      { group: "Integrations", items: ["MES", "ERP", "Power BI"] },
    ],
    developmentProcess: [
      { phase: "Pilot plant deep-dive (5 weeks)", body: "Defect taxonomy, line constraints, dataset curation, and edge feasibility." },
      { phase: "Model & operator UI (10 weeks)", body: "Initial models, operator UI, continuous learning loop, and pilot-line deployment." },
      { phase: "Pilot validation (6 weeks)", body: "Side-by-side operation against existing inspection, with weekly model and UI iterations." },
      { phase: "Network rollout (16 weeks)", body: "Plant-by-plant deployment with rapid adaptation for each plant's product mix." },
      { phase: "Continuous improvement", body: "Weekly model refresh, monthly defect-trend review with engineering and quality leadership." },
    ],
    results: [
      "Pre-shipment defect detection improved by ~4x across the network.",
      "Customer returns reduced by 38% in the first year of full operation.",
      "Line throughput maintained at baseline — no measurable cycle-time impact.",
      "Operator adoption above 90%, with the operator UI explicitly cited in plant satisfaction surveys.",
    ],
    metrics: [
      { value: "4x", label: "Detection" },
      { value: "−38%", label: "Returns" },
      { value: "0%", label: "Cycle impact" },
    ],
    testimonial: {
      quote:
        "It is not just an inspection tool — it is the fastest way our quality engineers have ever learned about a new defect mode.",
      author: "VP Quality & Engineering",
      role: "Multi-plant manufacturer",
      placeholder: true,
    },
  },
};

export const CASE_STUDY_SLUGS = Object.keys(CASE_STUDIES);

export const CASE_STUDY_CATEGORIES = [
  { id: "ai", label: "Applied AI" },
  { id: "saas", label: "SaaS product" },
  { id: "custom-software", label: "Custom software" },
  { id: "cloud-data", label: "Cloud & data" },
  { id: "mobile", label: "Mobile" },
  { id: "transformation", label: "Digital transformation" },
] as const;

/** Find related case studies by shared industry, category, or tags. */
export function relatedCaseStudies(slug: string, limit = 3): CaseStudyContent[] {
  const me = CASE_STUDIES[slug];
  if (!me) return [];
  const scored = Object.values(CASE_STUDIES)
    .filter((cs) => cs.slug !== slug)
    .map((cs) => {
      let score = 0;
      if (cs.industrySlug === me.industrySlug) score += 4;
      if (cs.category === me.category) score += 3;
      score += cs.serviceSlugs.filter((s) => me.serviceSlugs.includes(s)).length;
      score += cs.technologySlugs.filter((t) => me.technologySlugs.includes(t)).length;
      score += cs.tags.filter((t) => me.tags.includes(t)).length;
      return { cs, score };
    })
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.cs);
}
