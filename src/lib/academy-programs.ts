/**
 * HIGAET Academy — flagship program catalog.
 * Original HIGAET content; structure inspired by upGrad's program pages
 * (overview, curriculum, eligibility, fees, faculty, outcomes, FAQ).
 */

export type ProgramCategory = "ai" | "data" | "cloud" | "cyber" | "product" | "engineering";

export type Program = {
  slug: string;
  title: string;
  tagline: string;
  category: ProgramCategory;
  level: "Foundation" | "Career Track" | "Advanced" | "Executive";
  duration: string;
  format: "Online" | "On-campus" | "Hybrid";
  startDate: string;
  feeINR: string;
  emiFromINR: string;
  eligibility: string[];
  outcomes: string[];
  curriculum: { term: string; title: string; topics: string[] }[];
  faculty: { name: string; role: string; bio: string }[];
  hiringPartners: string[];
  faqs: { q: string; a: string }[];
};

export const CATEGORY_LABELS: Record<ProgramCategory, string> = {
  ai: "AI & Generative AI",
  data: "Data Science",
  cloud: "Cloud & DevOps",
  cyber: "Cybersecurity",
  product: "Product & Design",
  engineering: "Full-Stack Engineering",
};

export const PROGRAMS: Program[] = [
  {
    slug: "gen-ai-engineering",
    title: "Generative AI Engineering",
    tagline: "Ship production LLM systems — RAG, agents, evals, and inference at scale.",
    category: "ai",
    level: "Career Track",
    duration: "11 months",
    format: "Hybrid",
    startDate: "Next cohort: 14 September 2026",
    feeINR: "₹3,25,000",
    emiFromINR: "₹9,800/mo",
    eligibility: [
      "Bachelor's degree in any engineering, science, or quantitative discipline",
      "Working knowledge of Python (functions, classes, virtualenvs)",
      "Minimum 50% in undergraduate (relaxed for working professionals)",
      "Conversational English proficiency",
    ],
    outcomes: [
      "Build and deploy multi-agent RAG systems on production infrastructure",
      "Run rigorous LLM evaluations (offline + online) with measurable guardrails",
      "Fine-tune and serve open-weight models with cost-aware inference",
      "Lead AI projects end-to-end: problem framing, architecture, rollout, governance",
    ],
    curriculum: [
      {
        term: "Term 1 · Foundations (10 weeks)",
        title: "Engineering for AI",
        topics: ["Modern Python & typing", "Linear algebra you actually need", "Probability & statistics", "Data engineering with Polars/DuckDB"],
      },
      {
        term: "Term 2 · Core (12 weeks)",
        title: "LLMs in practice",
        topics: ["Transformer internals", "Prompting & structured outputs", "RAG architectures", "Vector stores & retrieval evals"],
      },
      {
        term: "Term 3 · Systems (10 weeks)",
        title: "Production AI systems",
        topics: ["Agents & tool use", "Observability for LLMs", "Cost & latency engineering", "Safety, red-teaming, governance"],
      },
      {
        term: "Term 4 · Capstone (12 weeks)",
        title: "Enterprise capstone",
        topics: ["Live brief from a hiring partner", "Architecture review", "Production deployment", "Industry jury defense"],
      },
    ],
    faculty: [
      { name: "Dr. Anika Rao", role: "Program Director", bio: "Former staff ML engineer with 12 years across applied research and production AI at global SaaS companies." },
      { name: "Vikram Iyer", role: "Lead Faculty — Systems", bio: "Builds large-scale inference platforms; mentors HIGAET cohorts on serving and observability." },
      { name: "Priya Menon", role: "Industry Mentor", bio: "Head of AI at a fintech unicorn; reviews capstone projects and runs mock interviews." },
    ],
    hiringPartners: ["AI-first SaaS firms", "Banking & financial services", "Consulting & systems integrators", "Healthcare technology"],
    faqs: [
      { q: "Do I need prior machine-learning experience?", a: "No. Term 1 brings everyone to a common foundation. Strong Python and quantitative thinking are what we expect at the start." },
      { q: "What does 'hybrid' mean for this program?", a: "Live evening cohorts run online four days a week, with two intensive on-campus weekends per term at the HIGAET Bengaluru campus." },
      { q: "Is there placement support?", a: "Yes — every Career Track student gets a dedicated placement counsellor, interview prep, and warm introductions to hiring partners." },
      { q: "Can my employer sponsor the fee?", a: "Yes. We provide GST invoices and structured sponsorship letters; many enterprise sponsors fund the program directly." },
    ],
  },
  {
    slug: "applied-data-science",
    title: "Applied Data Science",
    tagline: "From messy data to deployed models — the full applied-DS workflow.",
    category: "data",
    level: "Career Track",
    duration: "9 months",
    format: "Online",
    startDate: "Next cohort: 5 October 2026",
    feeINR: "₹2,40,000",
    emiFromINR: "₹7,200/mo",
    eligibility: [
      "Bachelor's degree in any discipline",
      "Basic familiarity with spreadsheets and SQL",
      "Comfort with quantitative reasoning",
    ],
    outcomes: [
      "Build end-to-end data pipelines with modern tools",
      "Frame and solve real business problems with ML",
      "Communicate findings to non-technical stakeholders",
      "Deploy and monitor models in production",
    ],
    curriculum: [
      { term: "Term 1 (10 weeks)", title: "Data foundations", topics: ["SQL deep dive", "Python for analysis", "Statistics for decisions", "Storytelling with data"] },
      { term: "Term 2 (10 weeks)", title: "Machine learning", topics: ["Supervised models", "Feature engineering", "Model evaluation", "Causal inference basics"] },
      { term: "Term 3 (10 weeks)", title: "Production", topics: ["MLOps essentials", "Monitoring & drift", "A/B testing", "Capstone"] },
    ],
    faculty: [
      { name: "Rahul Sengupta", role: "Program Director", bio: "Former Head of Data at a logistics platform; 10+ years building data teams." },
      { name: "Dr. Neha Bhatt", role: "Lead Faculty", bio: "Statistician and applied researcher with a focus on causal methods." },
    ],
    hiringPartners: ["E-commerce & marketplaces", "Banking", "Healthcare", "Consumer internet"],
    faqs: [
      { q: "Is this an online-only program?", a: "Yes — live cohorts run 4 evenings a week with recorded modules and weekend labs." },
      { q: "Will I get a portfolio?", a: "Yes. You graduate with 4 portfolio projects and 1 enterprise capstone reviewed by a hiring partner." },
    ],
  },
  {
    slug: "cloud-devops-engineering",
    title: "Cloud & DevOps Engineering",
    tagline: "Design, ship, and operate reliable cloud platforms.",
    category: "cloud",
    level: "Career Track",
    duration: "8 months",
    format: "Online",
    startDate: "Next cohort: 21 September 2026",
    feeINR: "₹2,15,000",
    emiFromINR: "₹6,450/mo",
    eligibility: ["Bachelor's degree (any)", "Comfort with Linux command line", "Basic networking concepts"],
    outcomes: [
      "Build CI/CD pipelines used by real engineering teams",
      "Operate Kubernetes clusters in production",
      "Design for reliability, observability, and cost",
      "Pass associate-level cloud certifications",
    ],
    curriculum: [
      { term: "Term 1", title: "Linux & networking", topics: ["Bash & systemd", "TCP/IP fundamentals", "Containers"] },
      { term: "Term 2", title: "Cloud platforms", topics: ["Compute, storage, networking", "IaC with Terraform", "Cost & governance"] },
      { term: "Term 3", title: "Platform engineering", topics: ["Kubernetes in depth", "Observability stack", "Incident response", "Capstone"] },
    ],
    faculty: [
      { name: "Sandeep Kulkarni", role: "Program Director", bio: "Platform leader who scaled infrastructure for two unicorns." },
    ],
    hiringPartners: ["Cloud-native startups", "Banking", "Telecom", "Enterprise SaaS"],
    faqs: [
      { q: "Which cloud do you teach?", a: "Concepts are vendor-neutral; labs cover AWS primarily, with comparative coverage of GCP and Azure." },
    ],
  },
  {
    slug: "cybersecurity-defense",
    title: "Cybersecurity & Defensive Engineering",
    tagline: "Detect, defend, and respond — the blue-team craft.",
    category: "cyber",
    level: "Career Track",
    duration: "10 months",
    format: "Hybrid",
    startDate: "Next cohort: 28 September 2026",
    feeINR: "₹2,75,000",
    emiFromINR: "₹8,300/mo",
    eligibility: ["Bachelor's degree", "Comfort with networking and OS basics", "No prior security experience required"],
    outcomes: [
      "Run SOC workflows on real telemetry",
      "Investigate incidents with disciplined methodology",
      "Harden cloud workloads and identity systems",
      "Prepare for industry-recognised certifications",
    ],
    curriculum: [
      { term: "Term 1", title: "Security foundations", topics: ["Threat models", "Network security", "Identity & access"] },
      { term: "Term 2", title: "Detection & response", topics: ["SIEM/SOAR", "Log analytics", "Incident handling"] },
      { term: "Term 3", title: "Cloud security & capstone", topics: ["AWS/GCP security", "Container security", "Red-team simulation"] },
    ],
    faculty: [
      { name: "Arjun Pillai", role: "Program Director", bio: "Former SOC lead at a global bank; specialises in detection engineering." },
    ],
    hiringPartners: ["Banks & insurance", "MSSPs", "Cloud providers", "Public sector"],
    faqs: [
      { q: "Is this a red-team or blue-team program?", a: "Primarily blue-team / defensive engineering, with enough offensive context to inform detections." },
    ],
  },
  {
    slug: "ai-product-management",
    title: "AI Product Management",
    tagline: "Build product judgment for an AI-native world.",
    category: "product",
    level: "Executive",
    duration: "6 months",
    format: "Online",
    startDate: "Next cohort: 12 October 2026",
    feeINR: "₹1,95,000",
    emiFromINR: "₹5,900/mo",
    eligibility: ["3+ years of professional experience", "Exposure to software products"],
    outcomes: [
      "Frame AI opportunities with measurable success criteria",
      "Run discovery and evals for AI features",
      "Govern data, safety, and cost trade-offs",
      "Lead cross-functional AI launches",
    ],
    curriculum: [
      { term: "Module 1", title: "AI literacy for PMs", topics: ["LLM capabilities & limits", "Evals as the product spec"] },
      { term: "Module 2", title: "Discovery & design", topics: ["AI UX patterns", "Risk & safety reviews"] },
      { term: "Module 3", title: "Launch & operate", topics: ["Rollout strategy", "Cost & latency", "Capstone"] },
    ],
    faculty: [
      { name: "Meera Krishnan", role: "Program Director", bio: "Product leader who shipped GenAI features at consumer scale." },
    ],
    hiringPartners: ["SaaS", "Fintech", "Consumer internet"],
    faqs: [
      { q: "Do I need to code?", a: "No, but you should be comfortable reading specs and reasoning about data." },
    ],
  },
  {
    slug: "foundations-of-ai",
    title: "Foundations of AI",
    tagline: "A serious 12-week introduction for newcomers and switchers.",
    category: "ai",
    level: "Foundation",
    duration: "12 weeks",
    format: "Online",
    startDate: "Rolling admissions",
    feeINR: "₹65,000",
    emiFromINR: "₹2,200/mo",
    eligibility: ["Bachelor's degree (any)", "Curiosity and discipline"],
    outcomes: [
      "Understand how modern AI systems are built",
      "Use LLMs effectively in your current role",
      "Decide whether to pursue an advanced HIGAET track",
    ],
    curriculum: [
      { term: "Weeks 1-4", title: "How AI works", topics: ["Models, data, training", "Tokens & embeddings"] },
      { term: "Weeks 5-8", title: "Using LLMs", topics: ["Prompting", "Retrieval", "Evaluation"] },
      { term: "Weeks 9-12", title: "Mini-project", topics: ["Pick a workflow", "Build & ship", "Demo day"] },
    ],
    faculty: [
      { name: "HIGAET Faculty Pool", role: "Rotating instructors", bio: "Curated by the program director from across HIGAET tracks." },
    ],
    hiringPartners: [],
    faqs: [
      { q: "Will this get me a job?", a: "Foundations is a literacy program. Combine it with a Career Track to target a role change." },
    ],
  },
];

export function getProgram(slug: string): Program | undefined {
  return PROGRAMS.find((p) => p.slug === slug);
}

export type Campus = {
  slug: string;
  name: string;
  partnerType: "Awarding partner" | "Industry campus";
  city: string;
  degree: string;
  durationYears: number;
  eligibility: string[];
  highlights: string[];
  scholarship: string;
};

export const CAMPUSES: Campus[] = [
  {
    slug: "higaet-bengaluru",
    name: "HIGAET Bengaluru Campus",
    partnerType: "Industry campus",
    city: "Bengaluru, KA",
    degree: "Industry Diploma in Generative AI Engineering",
    durationYears: 1,
    eligibility: [
      "Bachelor's degree in any discipline",
      "Cleared the HIGAET Aptitude Test (HAT) or equivalent",
      "Working knowledge of Python",
    ],
    highlights: [
      "On-campus labs with production-grade GPU infrastructure",
      "Weekly industry guest sessions",
      "Embedded internship in the second half of the program",
    ],
    scholarship: "Merit scholarships up to 50% via the HAT.",
  },
  {
    slug: "higaet-hyderabad",
    name: "HIGAET Hyderabad Campus",
    partnerType: "Industry campus",
    city: "Hyderabad, TS",
    degree: "Industry Diploma in Cloud & Platform Engineering",
    durationYears: 1,
    eligibility: [
      "Bachelor's degree in any discipline",
      "Cleared the HIGAET Aptitude Test (HAT)",
    ],
    highlights: [
      "Live SRE-style war rooms with operating partners",
      "Dedicated placement track for cloud roles",
      "Industry-graded capstone with a hiring panel",
    ],
    scholarship: "Need-based scholarships of 20–40%; merit awards up to 60%.",
  },
];

export function getCampus(slug: string): Campus | undefined {
  return CAMPUSES.find((c) => c.slug === slug);
}
