/**
 * HIGAET P5.2 — Hub Authority Block content registry.
 *
 * Authority-grade semantic data for each topic cluster hub. Used by
 * <HubAuthorityBlock /> to render: definition snippet · comparative table ·
 * workflow steps · entity reinforcement · top-spoke reinforcement loop.
 *
 * Adding entries here raises the SEO Graph integrity score (hub authority
 * weight) and supplies entity density for AEO / AI-search grounding.
 */
import type { ClusterId } from "./topic-clusters";

export interface ComparisonRow {
  option: string;
  useCase: string;
  difficulty: "Easy" | "Medium" | "Hard";
  outcome: string;
}

export interface WorkflowStep {
  step: string;
  body: string;
}

export interface HubAuthorityData {
  clusterId: ClusterId;
  /** Featured-snippet style definition (2-4 sentences). */
  definition: string;
  /** Comparative table — 3-6 rows. */
  comparison: ComparisonRow[];
  /** Linear workflow — 4-6 steps. */
  workflow: WorkflowStep[];
  /** Entity reinforcement: countries, institutions, systems, tools. */
  entities: {
    countries?: string[];
    institutions?: string[];
    systems?: string[];
    funding?: string[];
    tools?: string[];
  };
  /** Reinforcement loop — top 5 spoke paths (must exist in topic-clusters). */
  topSpokes: string[];
}

export const HUB_AUTHORITY: Record<ClusterId, HubAuthorityData> = {
  "academy-genai-engineering": {
    clusterId: "academy-genai-engineering",
    definition:
      "HIGAET Academy is a Gen AI engineering institute that delivers industry-recognized diplomas, certifications, and learning paths. Programs combine live cohorts, hands-on labs, and placement support so learners ship production AI systems, not just notebooks.",
    comparison: [
      { option: "Degree & diploma programs", useCase: "Career switch into AI", difficulty: "Hard", outcome: "Full-stack AI engineer" },
      { option: "Learning paths", useCase: "Structured upskilling", difficulty: "Medium", outcome: "Track-aligned specialist" },
      { option: "Certifications", useCase: "Validate existing skills", difficulty: "Medium", outcome: "Industry-recognized credential" },
      { option: "Corporate training", useCase: "Team capability uplift", difficulty: "Easy", outcome: "Closed cohort outcomes" },
    ],
    workflow: [
      { step: "Step 1 — Pick a track", body: "Choose a program or learning path matched to your background." },
      { step: "Step 2 — Apply & verify eligibility", body: "Admissions reviews prerequisites and intake calendar." },
      { step: "Step 3 — Cohort onboarding", body: "Live classes, mentor allocation, and lab provisioning." },
      { step: "Step 4 — Build production projects", body: "Capstones reviewed by HIGAET Technologies engineers." },
      { step: "Step 5 — Certification & placement", body: "Earn credentials and enter the placements pipeline." },
    ],
    entities: {
      institutions: ["HIGAET Academy", "HIGAET Bengaluru campus", "HIGAET Hyderabad campus"],
      systems: ["Live cohort delivery", "Capstone review board", "Placement panel"],
      tools: ["HIGAET AI Copilot", "Project review workbench", "Certification ledger"],
    },
    topSpokes: [
      "/academy/programs",
      "/academy/learning-paths",
      "/academy/certifications",
      "/academy/admissions",
      "/academy/faq",
    ],
  },

  "academy-career-outcomes": {
    clusterId: "academy-career-outcomes",
    definition:
      "HIGAET Academy career outcomes cover placements, internships, and alumni progression across hiring partners. Every cohort is tracked from capstone through offer letter so prospective learners see real salary ranges and placement velocity.",
    comparison: [
      { option: "Placements", useCase: "Full-time roles after graduation", difficulty: "Medium", outcome: "Offer with HIGAET partner" },
      { option: "Internships", useCase: "Industry exposure during program", difficulty: "Easy", outcome: "3-6 month engagement" },
      { option: "Alumni network", useCase: "Mid-career mobility", difficulty: "Easy", outcome: "Warm referrals" },
      { option: "Scholarships", useCase: "Funded entry into the program", difficulty: "Medium", outcome: "Tuition support" },
    ],
    workflow: [
      { step: "Step 1 — Career profile", body: "Counselors build a target-role profile during admissions." },
      { step: "Step 2 — Skill mapping", body: "Program work is aligned to role-specific evidence." },
      { step: "Step 3 — Interview readiness", body: "Mock interviews and portfolio reviews before placements open." },
      { step: "Step 4 — Hiring pipeline", body: "Partner companies shortlist via HIGAET placement panel." },
      { step: "Step 5 — Post-offer support", body: "Onboarding, negotiation, and 90-day check-ins." },
    ],
    entities: {
      institutions: ["HIGAET placements panel", "HIGAET Academy", "HIGAET Technologies"],
      systems: ["Placement tracker", "Interview prep workbench", "Alumni mentorship"],
      funding: ["Merit scholarships", "Need-based scholarships", "Income-share options"],
    },
    topSpokes: [
      "/academy/internships",
      "/academy/success-stories",
      "/academy/scholarship",
      "/careers",
      "/academy/contact",
    ],
  },

  "academy-campuses-formats": {
    clusterId: "academy-campuses-formats",
    definition:
      "HIGAET Academy operates physical campuses in Bengaluru and Hyderabad alongside online and corporate formats. Learners pick the delivery model that fits their geography and schedule while sharing the same curriculum and placement pipeline.",
    comparison: [
      { option: "Bengaluru campus", useCase: "On-site diploma with labs", difficulty: "Medium", outcome: "In-person residency" },
      { option: "Hyderabad campus", useCase: "On-site diploma with labs", difficulty: "Medium", outcome: "In-person residency" },
      { option: "Online cohort", useCase: "Remote learners across India", difficulty: "Easy", outcome: "Live + recorded delivery" },
      { option: "Corporate training", useCase: "Closed cohorts for companies", difficulty: "Easy", outcome: "Tailored skill uplift" },
    ],
    workflow: [
      { step: "Step 1 — Pick a format", body: "Select campus, online, or corporate intake." },
      { step: "Step 2 — Confirm intake", body: "Lock seat for the next cohort start date." },
      { step: "Step 3 — Onboarding", body: "Receive schedule, lab access, and pre-reads." },
      { step: "Step 4 — Live delivery", body: "Cohort runs identically across formats." },
      { step: "Step 5 — Certification", body: "Same HIGAET credential regardless of format." },
    ],
    entities: {
      countries: ["India"],
      institutions: ["HIGAET Bengaluru", "HIGAET Hyderabad"],
      systems: ["Online cohort platform", "Corporate training portal"],
    },
    topSpokes: [
      "/academy/campuses/higaet-bengaluru",
      "/academy/campuses/higaet-hyderabad",
      "/academy/online-courses",
      "/academy/offline-training",
      "/academy/corporate-training",
    ],
  },

  "global-study-abroad": {
    clusterId: "global-study-abroad",
    definition:
      "HIGAET Global Education Hub guides students through university selection, applications, and pre-departure for studying abroad. Counselors handle shortlisting, documentation, and visa coordination across our partner-university network.",
    comparison: [
      { option: "Undergraduate pathways", useCase: "School-leavers going abroad", difficulty: "Medium", outcome: "Bachelor's admission" },
      { option: "Postgraduate pathways", useCase: "Working professionals", difficulty: "Hard", outcome: "Master's admission" },
      { option: "Short certifications", useCase: "Skill-led mobility", difficulty: "Easy", outcome: "Credit-bearing certificate" },
      { option: "Pathway programs", useCase: "Conditional admission", difficulty: "Medium", outcome: "Bridge into degree" },
    ],
    workflow: [
      { step: "Step 1 — Counselling intake", body: "Profile review and country-fit mapping." },
      { step: "Step 2 — University shortlist", body: "3-8 institutions matched to budget and intent." },
      { step: "Step 3 — Applications", body: "Documents, SOP, and recommendations curated." },
      { step: "Step 4 — Visa processing", body: "Embassy file, mock interview, and submission." },
      { step: "Step 5 — Pre-departure", body: "Housing, forex, insurance, and arrival kit." },
    ],
    entities: {
      countries: ["USA", "UK", "Canada", "Australia", "Germany", "Ireland"],
      institutions: ["HIGAET Global Education Hub", "Partner universities"],
      systems: ["University application workbench", "SOP review desk", "Pre-departure desk"],
      funding: ["Education loans", "Merit scholarships", "Need-based aid"],
    },
    topSpokes: [
      "/global-education/study-abroad",
      "/global-education/universities",
      "/global-education/countries",
      "/global-education/admission-process",
      "/global-education/student-services",
    ],
  },

  "global-visa-funding": {
    clusterId: "global-visa-funding",
    definition:
      "HIGAET visa guidance covers documentation, SOP writing, embassy interview preparation, and funding evidence for student visas across the USA, UK, and Canada. Counselors manage timelines so applications land inside the embassy window for each intake.",
    comparison: [
      { option: "USA F-1 visa", useCase: "Full-time student in the US", difficulty: "Hard", outcome: "Interview-based approval" },
      { option: "UK Student Route", useCase: "Full-time student in the UK", difficulty: "Medium", outcome: "Points-based approval" },
      { option: "Canada Study Permit", useCase: "Full-time student in Canada", difficulty: "Medium", outcome: "Document-based approval" },
      { option: "Funding evidence", useCase: "Loan or sponsor letters", difficulty: "Medium", outcome: "Bank-verified file" },
    ],
    workflow: [
      { step: "Step 1 — Eligibility check", body: "Confirm offer, funds, and country rules." },
      { step: "Step 2 — Document pack", body: "Assemble I-20 / CAS / LOA, SOP, and financials." },
      { step: "Step 3 — Mock interview", body: "Embassy-style prep with counselor." },
      { step: "Step 4 — Submission", body: "Slot booking and biometrics." },
      { step: "Step 5 — Pre-departure", body: "Travel, housing, and SIM/forex handoff." },
    ],
    entities: {
      countries: ["USA", "UK", "Canada"],
      systems: ["F-1 visa", "UK Student Route", "Canada Study Permit"],
      funding: ["Education loans", "Merit scholarships", "Sponsor affidavits"],
      institutions: ["HIGAET Global Education Hub"],
    },
    topSpokes: [
      "/global-education/scholarships",
      "/global-education/knowledge-base/universities",
      "/global-education/countries/usa",
      "/global-education/countries/uk",
      "/global-education/countries/canada",
    ],
  },

  "tech-ai-services": {
    clusterId: "tech-ai-services",
    definition:
      "HIGAET Technologies builds production AI, data, and cloud systems for enterprises. Teams ship LLM applications, data platforms, and modernization programs with embedded SRE and security review.",
    comparison: [
      { option: "Applied AI solutions", useCase: "Ship an LLM product", difficulty: "Hard", outcome: "Production AI system" },
      { option: "Data engineering", useCase: "Reliable analytics platform", difficulty: "Medium", outcome: "Lakehouse + pipelines" },
      { option: "Cloud migration", useCase: "Modernize legacy estate", difficulty: "Hard", outcome: "Re-platformed workloads" },
      { option: "Custom software", useCase: "Bespoke product engineering", difficulty: "Medium", outcome: "Owned product surface" },
    ],
    workflow: [
      { step: "Step 1 — Discovery", body: "Solutions architect scopes the problem and constraints." },
      { step: "Step 2 — Architecture", body: "Reference architecture and delivery plan." },
      { step: "Step 3 — Build", body: "Cross-functional team implements with weekly demos." },
      { step: "Step 4 — Hardening", body: "SRE, security, and compliance review." },
      { step: "Step 5 — Run & evolve", body: "Managed operations or transfer to in-house team." },
    ],
    entities: {
      systems: ["AWS", "Azure", "GCP", "Kubernetes", "Snowflake", "Databricks"],
      tools: ["HIGAET AI Copilot", "Reference architectures", "Delivery telemetry"],
      institutions: ["HIGAET Technologies"],
    },
    topSpokes: [
      "/technologies/ai-solutions",
      "/technologies/data-engineering",
      "/technologies/cloud-solutions",
      "/technologies/devops",
      "/technologies/custom-software-development",
    ],
  },

  "tech-engagement-models": {
    clusterId: "tech-engagement-models",
    definition:
      "HIGAET engagement models let clients pick how they consume engineering capacity — dedicated teams, staff augmentation, offshore centers, build-operate-transfer, fixed-price, or time-and-materials. Each model carries the same delivery standards and governance.",
    comparison: [
      { option: "Dedicated team", useCase: "Long-running product", difficulty: "Medium", outcome: "Embedded squad" },
      { option: "Staff augmentation", useCase: "Skill gap on existing team", difficulty: "Easy", outcome: "Plug-in engineers" },
      { option: "Build-operate-transfer", useCase: "Stand up a captive center", difficulty: "Hard", outcome: "Owned offshore team" },
      { option: "Fixed-price", useCase: "Scoped deliverable", difficulty: "Medium", outcome: "Milestone-based delivery" },
    ],
    workflow: [
      { step: "Step 1 — Engagement fit", body: "Match model to outcome, risk, and timeline." },
      { step: "Step 2 — Commercials", body: "Rate cards, SLAs, and IP terms agreed." },
      { step: "Step 3 — Team formation", body: "Roles staffed against the engagement plan." },
      { step: "Step 4 — Delivery cadence", body: "Weekly demos and steering reviews." },
      { step: "Step 5 — Transition", body: "Hand-off, retain, or evolve the engagement." },
    ],
    entities: {
      systems: ["Dedicated team", "Staff augmentation", "BOT", "Fixed price", "Time & materials"],
      institutions: ["HIGAET Technologies", "HIGAET delivery centers"],
    },
    topSpokes: [
      "/technologies/engagement/dedicated-development-team",
      "/technologies/engagement/staff-augmentation",
      "/technologies/engagement/offshore-development-center",
      "/technologies/engagement/build-operate-transfer",
      "/technologies/engagement/fixed-price-projects",
    ],
  },

  "tech-industry-solutions": {
    clusterId: "tech-industry-solutions",
    definition:
      "HIGAET Technologies case studies document outcomes across regulated and consumer industries. Each engagement is structured around a measurable business metric, with reference architectures published for reuse.",
    comparison: [
      { option: "Enterprise software", useCase: "Internal platforms at scale", difficulty: "Hard", outcome: "Owned enterprise product" },
      { option: "AI-powered marketing", useCase: "Growth and lifecycle automation", difficulty: "Medium", outcome: "Lift in conversion" },
      { option: "Industry solutions", useCase: "Sector-aligned reference build", difficulty: "Medium", outcome: "Compliant accelerator" },
      { option: "Custom engagements", useCase: "Bespoke transformation", difficulty: "Hard", outcome: "Multi-year roadmap" },
    ],
    workflow: [
      { step: "Step 1 — Industry fit", body: "Sector lead reviews regulatory and data context." },
      { step: "Step 2 — Reference architecture", body: "Pick a published baseline or co-design one." },
      { step: "Step 3 — Pilot", body: "Time-boxed proof against a business metric." },
      { step: "Step 4 — Scale", body: "Roll out across business units or regions." },
      { step: "Step 5 — Operate", body: "Managed services or transfer to client SRE." },
    ],
    entities: {
      systems: ["Reference architectures", "Compliance baselines", "Industry accelerators"],
      institutions: ["HIGAET Technologies"],
      tools: ["Case study library", "Solution playbooks"],
    },
    topSpokes: [
      "/technologies/enterprise-software",
      "/technologies/digital-marketing",
      "/technologies/industries",
      "/technologies/company",
      "/technologies/contact",
    ],
  },
};

export function getHubAuthority(clusterId: ClusterId): HubAuthorityData | null {
  return HUB_AUTHORITY[clusterId] ?? null;
}
