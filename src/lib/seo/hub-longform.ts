/**
 * HIGAET Hub long-form authority content.
 *
 * One entry per cluster hub. Rendered by <HubLongform clusterId="…" />,
 * which also emits FAQPage JSON-LD for AEO/AI-search.
 *
 * Keep copy concise but specific — entity-laden, scannable, no filler.
 */
import type { ClusterId } from "./topic-clusters";

export interface UseCase { title: string; body: string }
export interface WorkflowStep { step: string; body: string }
export interface PersonaAdaptation { persona: string; body: string }
export interface ToolMapping { feature: string; body: string }
export interface FaqItem { q: string; a: string }

export interface HubLongform {
  /** Cluster this long-form block belongs to. */
  clusterId: ClusterId;
  /** Public URL of the hub page (must match topic-clusters hub.path). */
  path: string;
  /** Section heading shown above the long-form block. */
  heading: string;
  /** One-paragraph overview rendered first. */
  overview: string;
  /** Who this cluster is for. */
  audience: string[];
  /** 5–7 real scenarios. */
  useCases: UseCase[];
  /** Step-by-step user workflow. */
  workflow: WorkflowStep[];
  /** Persona / region adaptations. */
  adaptations: PersonaAdaptation[];
  /** HIGAET tooling / feature mapping. */
  tools: ToolMapping[];
  /** 8–12 long-tail FAQ items (emitted as FAQPage JSON-LD). */
  faqs: FaqItem[];
}

export const HUB_LONGFORM: Partial<Record<ClusterId, HubLongform>> = {
  "academy-genai-engineering": {
    clusterId: "academy-genai-engineering",
    path: "/academy",
    heading: "About HIGAET Academy — Gen AI engineering, end to end",
    overview:
      "HIGAET Academy trains generative-AI engineers through structured programs that combine foundations, applied projects, and employer-aligned outcomes. Every learning path maps to a real production role — AI engineer, prompt engineer, AI agents developer, automation engineer, or full-stack AI builder.",
    audience: [
      "School and college students entering AI for the first time",
      "Working software engineers moving into Gen AI roles",
      "Data and analytics professionals adding LLM skills",
      "Founders building AI-native products",
      "Enterprise teams upskilling on Gen AI delivery",
    ],
    useCases: [
      { title: "Career switch into AI engineering", body: "Move from a non-AI engineering role into an applied AI position with a portfolio of shipped projects." },
      { title: "Specialize in AI agents and automation", body: "Build production-grade agentic systems with evaluation, guardrails, and observability." },
      { title: "Prompt engineering for product teams", body: "Design, version, and test prompts that ship to real users." },
      { title: "Full-stack AI product delivery", body: "Combine LLMs, retrieval, vector storage, and front-end interfaces into one product." },
      { title: "Corporate cohort upskilling", body: "Run private cohorts for an engineering org with custom case studies." },
      { title: "University and campus-based learning", body: "Long-form residential programs with mentor and faculty access." },
      { title: "Certification and credentialing", body: "Industry-recognized certifications validated by hiring partners." },
    ],
    workflow: [
      { step: "1. Discover", body: "Browse programs and learning paths; map them to a role goal." },
      { step: "2. Apply", body: "Submit the Academy application; assessments and counselor calls confirm fit." },
      { step: "3. Enroll", body: "Pick a format — online, campus, or corporate cohort — and lock dates." },
      { step: "4. Learn", body: "Work through foundations, applied modules, and a capstone with reviewer feedback." },
      { step: "5. Certify", body: "Pass evaluations to earn the HIGAET certification tied to your track." },
      { step: "6. Place", body: "Engage placement support for portfolio review, interview prep, and partner introductions." },
    ],
    adaptations: [
      { persona: "Beginner learners", body: "Start at the AI literacy track and progress through fundamentals before specialization." },
      { persona: "Experienced engineers", body: "Skip to applied tracks (agents, automation, retrieval) with diagnostic placement." },
      { persona: "India-based learners", body: "Local payment options, INR pricing, and regional campus presence." },
      { persona: "Global learners", body: "Online cohorts across time zones with English-language delivery." },
      { persona: "Budget-conscious learners", body: "Scholarships, EMI options, and self-paced online tracks." },
      { persona: "Premium / fast-track learners", body: "Mentor-intensive cohorts with priority placement support." },
    ],
    tools: [
      { feature: "AI Copilot", body: "Personalized tutor and reviewer embedded in the learner dashboard." },
      { feature: "Project workbench", body: "Capstone scaffolding with evaluation rubrics for each role track." },
      { feature: "Placement workflow", body: "Portfolio prep, interview practice, and hiring-partner pipelines." },
      { feature: "Corporate LMS", body: "Closed cohorts with reporting for L&D and engineering leadership." },
    ],
    faqs: [
      { q: "Who is HIGAET Academy designed for?", a: "Aspiring and practicing engineers who want production-grade Gen AI skills, plus enterprise teams upskilling at scale." },
      { q: "What is the difference between learning paths and programs?", a: "Learning paths are role-mapped sequences; programs are formally enrolled cohorts with assessments, certification, and placement support." },
      { q: "Are HIGAET certifications recognized by employers?", a: "Yes. Certifications are validated by hiring partners across India and global markets and are mapped to active job roles." },
      { q: "Do I need prior programming experience?", a: "Most applied tracks assume basic programming literacy. Beginner tracks start with foundations before progressing." },
      { q: "Can I learn online or only on campus?", a: "Both. Online (live and self-paced), campus-based, and hybrid formats are available." },
      { q: "How does placement support work?", a: "Eligible graduates get role mapping, portfolio review, interview coaching, and introductions to hiring partners." },
      { q: "Are scholarships available?", a: "Yes — merit-based and need-based scholarships are reviewed during admissions." },
      { q: "Do corporate cohorts include custom content?", a: "Yes. Enterprise cohorts include custom case studies, private mentor pools, and confidential project work." },
      { q: "How long does a typical program take?", a: "Short certifications run 6–12 weeks; flagship programs run 4–10 months depending on track and format." },
      { q: "Can I switch between formats mid-program?", a: "Where seats allow, learners may switch from online to campus (or vice versa) at module boundaries." },
    ],
  },

  "academy-career-outcomes": {
    clusterId: "academy-career-outcomes",
    path: "/academy/placements",
    heading: "Placements & career outcomes",
    overview:
      "Placement support at HIGAET is built into the learning journey, not bolted on. Role mapping starts at enrollment; portfolio prep, interview readiness, and hiring-partner introductions follow as learners reach defined milestones.",
    audience: [
      "Final-cohort learners preparing for AI roles",
      "Career switchers from adjacent engineering fields",
      "Alumni returning for follow-on placement support",
      "Employers hiring HIGAET-trained engineers",
    ],
    useCases: [
      { title: "First AI engineering role", body: "Move from a learner cohort to an entry-level AI engineering offer." },
      { title: "Career switch into AI", body: "Translate prior engineering experience into an AI-specialist role." },
      { title: "Internship placement", body: "Convert internship engagements with partner companies into full-time offers." },
      { title: "Premium placements", body: "Hiring-partner pipelines for high-bar product and AI-platform roles." },
      { title: "Alumni reactivation", body: "Returning graduates leverage updated portfolios and partner networks." },
    ],
    workflow: [
      { step: "1. Role mapping", body: "Identify realistic target roles based on skills, projects, and market demand." },
      { step: "2. Portfolio prep", body: "Shape capstones, GitHub, and resume narratives for hiring teams." },
      { step: "3. Interview coaching", body: "Mock interviews — technical, system design, and HR — with structured feedback." },
      { step: "4. Hiring-partner intro", body: "Targeted introductions where readiness and role fit align." },
      { step: "5. Offer support", body: "Negotiation guidance and onboarding readiness through the agreed support window." },
    ],
    adaptations: [
      { persona: "Freshers", body: "Heavier coaching on fundamentals and behavioral interviews." },
      { persona: "Mid-career switchers", body: "Repositioning past experience as relevant to AI delivery." },
      { persona: "Senior engineers", body: "Architectural interviews and staff-level AI engineering rounds." },
    ],
    tools: [
      { feature: "Placement portal", body: "Track readiness milestones, mock results, and partner introductions." },
      { feature: "Alumni network", body: "Peer referrals across the HIGAET graduate community." },
      { feature: "Partner CRM", body: "Hiring-partner pipelines surfaced to eligible learners." },
    ],
    faqs: [
      { q: "Is placement support guaranteed?", a: "Eligible learners receive structured placement support; outcomes depend on readiness, role fit, and market timing." },
      { q: "What roles do graduates typically land?", a: "AI engineer, prompt engineer, AI agents developer, automation engineer, ML engineer, and full-stack AI engineer." },
      { q: "What salary ranges should I expect?", a: "Indicative ranges vary by role and geography; placement counselors share realistic targets at role-mapping." },
      { q: "Can alumni access placement support later?", a: "Yes — alumni can re-engage placement services within the published policy window." },
      { q: "Do you work with international employers?", a: "Yes, with partners hiring remote and on-site roles across multiple regions." },
      { q: "How are hiring partners vetted?", a: "Partners are reviewed for role quality, payment terms, and hiring practices before being added to the pipeline." },
      { q: "What if I miss readiness milestones?", a: "Counselors define a remediation plan; introductions resume once readiness criteria are met." },
      { q: "Is internship-to-FTE common?", a: "Yes — many partner internships convert based on performance and team need." },
    ],
  },

  "academy-campuses-formats": {
    clusterId: "academy-campuses-formats",
    path: "/academy/campuses",
    heading: "Campuses & learning formats",
    overview:
      "Pick the learning format that fits your life. HIGAET Academy delivers programs across online cohorts, campus residencies, and corporate-private cohorts — with a consistent curriculum and certification across formats.",
    audience: [
      "Learners weighing online vs in-person delivery",
      "Working professionals needing evening or weekend cohorts",
      "Students choosing a residential campus experience",
      "Enterprises sourcing private closed cohorts",
    ],
    useCases: [
      { title: "Online cohort with live mentors", body: "Scheduled live classes plus recorded modules and 1:1 mentorship." },
      { title: "Campus-based residency", body: "In-person classes, labs, and peer collaboration at a HIGAET campus." },
      { title: "Hybrid delivery", body: "Mix online modules with periodic campus intensives." },
      { title: "Private corporate cohort", body: "Closed cohort delivered at client site or HIGAET campus." },
      { title: "Self-paced add-ons", body: "Pre-work and refreshers on demand alongside any format." },
    ],
    workflow: [
      { step: "1. Compare formats", body: "Review format trade-offs against schedule, budget, and learning style." },
      { step: "2. Confirm campus", body: "Choose a campus or online cohort with start date that fits." },
      { step: "3. Admissions", body: "Complete the per-campus admissions and assessment process." },
      { step: "4. Enroll & onboard", body: "Lock seat and complete onboarding for your chosen format." },
      { step: "5. Switch if needed", body: "Where seats allow, switch formats at module boundaries." },
    ],
    adaptations: [
      { persona: "Full-time students", body: "Campus residencies with peer-rich learning." },
      { persona: "Working professionals", body: "Online evening / weekend cohorts." },
      { persona: "Enterprise L&D", body: "Closed cohorts with custom content and reporting." },
    ],
    tools: [
      { feature: "Campus directory", body: "Locations, facilities, faculty, and intake calendars." },
      { feature: "Cohort calendar", body: "Upcoming online and campus cohorts with seat availability." },
      { feature: "Corporate cohort builder", body: "Scoping tooling for closed enterprise cohorts." },
    ],
    faqs: [
      { q: "Which format gives the best outcomes?", a: "Outcomes are comparable across formats. Pick the format that matches your schedule and learning style." },
      { q: "Can I attend a campus part-time?", a: "Selected programs offer part-time evening tracks at campuses; check per-campus intake." },
      { q: "Is online cohort delivery live?", a: "Yes — online cohorts blend live sessions with self-paced material." },
      { q: "How do hybrid intensives work?", a: "Hybrid learners attend short residential intensives between online modules." },
      { q: "Do corporate cohorts include certification?", a: "Yes — enterprise learners earn the same HIGAET certification on completion." },
      { q: "Are campus tours available?", a: "Yes — book a guided campus visit or a virtual tour with the Academy team." },
      { q: "Can I switch campuses mid-program?", a: "Where seats allow, intra-program campus transfers are possible at module boundaries." },
      { q: "What infrastructure do campuses provide?", a: "Classrooms, lab stations, mentor pods, and collaboration spaces, plus shared GPU access for applicable tracks." },
    ],
  },

  "global-study-abroad": {
    clusterId: "global-study-abroad",
    path: "/global-education",
    heading: "About HIGAET Global Education Hub",
    overview:
      "HIGAET Global Education Hub guides students end-to-end through study-abroad — university shortlisting, applications, scholarships, visa preparation, and pre-departure support. Counselors operate as long-term partners, not single-transaction agents.",
    audience: [
      "Undergraduate aspirants targeting overseas universities",
      "Postgraduate applicants for STEM, business, and design programs",
      "Working professionals pursuing international master's degrees",
      "Parents researching study-abroad pathways with their children",
    ],
    useCases: [
      { title: "University shortlisting", body: "Build a target list of safe, match, and reach universities aligned with the student profile." },
      { title: "Application management", body: "Coordinate transcripts, SOPs, LORs, and platform submissions across multiple universities." },
      { title: "Scholarship search", body: "Identify and apply to merit-based and need-based funding." },
      { title: "Visa preparation", body: "Documentation, financial evidence, and interview prep for embassy or credibility interviews." },
      { title: "Pre-departure readiness", body: "Travel, housing, insurance, and orientation coordination." },
    ],
    workflow: [
      { step: "1. Profile review", body: "Counselor reviews academic record, test scores, and goals." },
      { step: "2. Country & course shortlist", body: "Align destination and course with profile and budget." },
      { step: "3. University shortlist", body: "Build the safe/match/reach list." },
      { step: "4. Applications", body: "Prepare SOPs, LORs, transcripts, and submit on each platform." },
      { step: "5. Offer evaluation", body: "Compare offers, funding, and outcomes before accepting." },
      { step: "6. Visa & pre-departure", body: "Prepare visa documentation and pre-departure logistics." },
    ],
    adaptations: [
      { persona: "Undergraduate applicants", body: "Earlier timelines, standardized tests, and family-led research." },
      { persona: "Postgraduate applicants", body: "Research fit, advisor outreach, and funding alignment." },
      { persona: "Working professionals", body: "Executive and part-time programs, GMAT/GRE strategy, ROI focus." },
      { persona: "India-based applicants", body: "Familiarity with Indian transcripts, GIC, education loans, and INR-denominated planning." },
      { persona: "Premium pathways", body: "Top-tier universities, intensive editing, and advisor introductions." },
    ],
    tools: [
      { feature: "Counselor workbench", body: "1:1 counseling, shortlist tooling, and document tracking." },
      { feature: "Application tracker", body: "Status across all universities in one view." },
      { feature: "Visa file builder", body: "Country-aware checklists and financial-evidence templates." },
    ],
    faqs: [
      { q: "When should I start the study-abroad process?", a: "Ideally 12–18 months before the intended intake to allow tests, applications, and visa timelines." },
      { q: "Which countries does HIGAET support?", a: "Top destinations across North America, the UK, Europe, Asia-Pacific, and the Middle East — see the country guides." },
      { q: "How are universities shortlisted?", a: "Counselors balance academic fit, funding, post-study work rights, and family preferences." },
      { q: "Do you help with SOPs and LORs?", a: "Yes — through structured drafting, editing, and review cycles." },
      { q: "Can I apply to multiple countries at once?", a: "Yes, when timelines and budgets allow. Counselors help prioritize." },
      { q: "How are scholarships identified?", a: "Through a curated scholarships database plus university-specific funding research." },
      { q: "What is the cost of HIGAET counseling?", a: "Counseling packages vary by scope; transparent pricing is shared at the first call." },
      { q: "Is visa support included?", a: "Yes — visa documentation, financial-evidence planning, and interview prep are part of the end-to-end pathway." },
      { q: "What happens if I am not admitted?", a: "Counselors help re-strategize for the next intake or alternative destinations." },
    ],
  },

  "global-visa-funding": {
    clusterId: "global-visa-funding",
    path: "/global-education/visa-guidance",
    heading: "Visa guidance & student funding",
    overview:
      "Visa success depends on clarity and consistency — clean documentation, country-aware financial evidence, and confident interviews. HIGAET visa counselors prepare students for every step from admission to embassy.",
    audience: [
      "Admitted students preparing visa files",
      "Sponsors and parents supporting financial evidence",
      "Applicants planning education loans or GIC accounts",
      "Students preparing for embassy or credibility interviews",
    ],
    useCases: [
      { title: "Country-specific visa file", body: "Build a visa documentation file aligned with the destination's rules." },
      { title: "Financial-evidence planning", body: "Plan funds, sponsors, GIC, and proof timelines." },
      { title: "Education loan support", body: "Coordinate with partner lenders for student loans." },
      { title: "Scholarship applications", body: "Apply to merit, need-based, and country-specific scholarships." },
      { title: "Interview preparation", body: "Mock interviews for embassy or credibility checks." },
      { title: "Pre-departure compliance", body: "Travel, accommodation, insurance, and arrival readiness." },
    ],
    workflow: [
      { step: "1. Confirm admission", body: "Lock the university offer and confirm the visa pathway." },
      { step: "2. Document checklist", body: "Build the country-specific document set." },
      { step: "3. Financial evidence", body: "Assemble funds, sponsorship letters, and required deposits." },
      { step: "4. Application submission", body: "Submit on the embassy or government portal." },
      { step: "5. Interview prep", body: "Coach for embassy or credibility interviews." },
      { step: "6. Post-visa support", body: "Pre-departure logistics and on-arrival orientation." },
    ],
    adaptations: [
      { persona: "Loan-funded students", body: "Coordinate with lenders for disbursement timing and proof." },
      { persona: "Self-funded students", body: "Plan deposit timing and currency conversion." },
      { persona: "Sponsored students", body: "Sponsor affidavits, relationship proofs, and combined funding." },
      { persona: "Country-specific applicants", body: "Each country has unique rules — counselors adapt the file to fit." },
    ],
    tools: [
      { feature: "Visa file builder", body: "Country-aware checklists and document trackers." },
      { feature: "Scholarship finder", body: "Filter scholarships by country, course, and eligibility." },
      { feature: "Interview practice", body: "Mock-interview library with country-aware questions." },
    ],
    faqs: [
      { q: "When should I start visa preparation?", a: "As soon as the university offer is confirmed and any required deposit is paid." },
      { q: "How much financial proof is required?", a: "It varies by country and course; counselors share destination-specific thresholds." },
      { q: "Can I work part-time on a student visa?", a: "Most destinations allow limited part-time work — rules vary by country." },
      { q: "What if my visa is delayed?", a: "Counselors help with deferral, expedited processing, or alternative intakes." },
      { q: "Are scholarships and loans mutually exclusive?", a: "No — many students combine partial scholarships with education loans." },
      { q: "How are embassy interviews scored?", a: "Officers evaluate study intent, funding, and credibility of the application." },
      { q: "Do you help with dependent visas?", a: "Yes, where the destination permits dependent visas and the case fits." },
      { q: "What if my visa is rejected?", a: "Counselors review the rejection reason and prepare a stronger reapplication where viable." },
    ],
  },

  "tech-ai-services": {
    clusterId: "tech-ai-services",
    path: "/technologies",
    heading: "About HIGAET Technologies — AI & engineering services",
    overview:
      "HIGAET Technologies designs and ships production AI, data, cloud, and software systems for enterprises. Engagements are outcome-led: clearly defined scope, instrumented delivery, and architecture that survives the next two years.",
    audience: [
      "Enterprise leaders scoping AI initiatives",
      "Product teams that need an external AI delivery partner",
      "CIOs modernizing data and cloud platforms",
      "Founders building AI-native products",
    ],
    useCases: [
      { title: "Applied AI delivery", body: "From discovery to production deployment of LLM- and ML-powered systems." },
      { title: "Data platform build-out", body: "Lakehouses, pipelines, governance, and analytics platforms." },
      { title: "Business intelligence", body: "Dashboards, semantic layers, and decision-ready data products." },
      { title: "Custom product engineering", body: "Bespoke software with quality, performance, and observability built in." },
      { title: "Cloud architecture & migration", body: "Multi-cloud architecture, migration, and operations." },
      { title: "DevOps and platform engineering", body: "CI/CD, SRE, and golden-path platform teams." },
      { title: "Digital transformation programs", body: "Multi-year modernization with sequenced delivery." },
    ],
    workflow: [
      { step: "1. Discovery", body: "Scope outcomes, constraints, and stakeholders." },
      { step: "2. Solution shaping", body: "Recommend engagement model, team mix, and roadmap." },
      { step: "3. Mobilize", body: "Stand up the team, environments, and delivery cadence." },
      { step: "4. Deliver", body: "Iterate in instrumented sprints with measurable milestones." },
      { step: "5. Operate & evolve", body: "Run, observe, and continuously improve the system in production." },
    ],
    adaptations: [
      { persona: "Mid-market clients", body: "Lean teams with senior leverage and shorter discovery cycles." },
      { persona: "Enterprise clients", body: "Larger pods, governance integration, and program-level reporting." },
      { persona: "AI-native startups", body: "Hands-on engineering at founder pace with reusable platform tooling." },
      { persona: "Public-sector engagements", body: "Compliance, audit, and procurement-friendly delivery." },
    ],
    tools: [
      { feature: "AI Copilot patterns", body: "Reusable building blocks for retrieval, evaluation, and agents." },
      { feature: "Delivery telemetry", body: "Instrumented sprints and outcome dashboards for clients." },
      { feature: "Cloud landing zones", body: "Hardened reference architectures for AWS, Azure, and GCP." },
    ],
    faqs: [
      { q: "How does HIGAET Technologies engage with clients?", a: "Through several engagement models — dedicated teams, staff augmentation, offshore centers, BOT, and fixed-price or T&M projects." },
      { q: "What size of engagements do you take?", a: "From small specialist pods to large multi-year programs." },
      { q: "Do you cover AI, data, and cloud together?", a: "Yes — most engagements combine more than one capability area." },
      { q: "Where are your teams located?", a: "Across HIGAET delivery centers, including India-based offshore capacity and on-site staffing where required." },
      { q: "What is your delivery methodology?", a: "Outcome-led agile with instrumented sprints and stakeholder reporting." },
      { q: "How do you handle data security and compliance?", a: "Security and compliance are scoped at discovery — including data residency, access controls, and audit." },
      { q: "Can you take over an in-flight project?", a: "Yes — we run discovery first to confirm scope, debt, and the right transition plan." },
      { q: "How are AI systems evaluated before release?", a: "With automated eval suites, human review, and progressive rollout (shadow, canary, gradual exposure)." },
      { q: "Do you provide training to client teams?", a: "Yes — knowledge transfer and HIGAET Academy enterprise cohorts are common follow-ons." },
      { q: "What is the typical engagement length?", a: "From 8-week scoped projects to multi-year platform programs." },
    ],
  },

  "tech-engagement-models": {
    clusterId: "tech-engagement-models",
    path: "/technologies/engagement",
    heading: "Engagement models",
    overview:
      "Pick the engagement model that fits the work. HIGAET Technologies contracts through dedicated teams, staff augmentation, offshore development centers, build-operate-transfer, fixed-price projects, or time and materials — each with clear commercials and accountability.",
    audience: [
      "CIOs and CTOs selecting a delivery model",
      "Product leaders extending in-house teams",
      "PE-backed companies operating offshore capacity",
      "Procurement teams comparing engagement structures",
    ],
    useCases: [
      { title: "Long-running dedicated team", body: "Embedded team owning a product or platform area for multiple quarters." },
      { title: "Specialist augmentation", body: "Add engineers with specific skills to an existing in-house team." },
      { title: "Offshore development center", body: "Stand up persistent offshore capacity at HIGAET." },
      { title: "Build-operate-transfer", body: "Build a team, operate it, then hand over to the client entity." },
      { title: "Fixed-price scoped delivery", body: "Defined scope, defined milestones, defined price." },
      { title: "Time and materials", body: "Flexible engagement billed by effort against a roadmap." },
    ],
    workflow: [
      { step: "1. Goal & constraints", body: "Define the outcome, timeline, and budget envelope." },
      { step: "2. Model recommendation", body: "Pick the engagement model that fits scope and risk." },
      { step: "3. Team composition", body: "Agree on the right mix of roles and seniority." },
      { step: "4. Commercials", body: "Lock the contract structure, billing cadence, and reporting." },
      { step: "5. Mobilize & deliver", body: "Onboard, integrate, and start delivery." },
    ],
    adaptations: [
      { persona: "Tight budget, defined scope", body: "Prefer fixed-price." },
      { persona: "Evolving scope, ongoing work", body: "Prefer dedicated team or T&M." },
      { persona: "Skill-gap fills", body: "Prefer staff augmentation." },
      { persona: "Multi-year capacity plays", body: "Prefer ODC or BOT." },
    ],
    tools: [
      { feature: "Engagement comparator", body: "Side-by-side model comparison for procurement." },
      { feature: "Capacity calendar", body: "Visible team rampup and burndown across the engagement." },
    ],
    faqs: [
      { q: "How do I choose between models?", a: "Match the model to scope stability, budget structure, and team-control needs — counselors recommend a fit based on goals." },
      { q: "Can I switch models mid-engagement?", a: "Yes — switching from T&M to fixed-price or dedicated team is common as scope crystallizes." },
      { q: "What is BOT and when is it useful?", a: "Build-Operate-Transfer stands up a team that HIGAET operates and later hands over to the client — useful for offshore capacity plays." },
      { q: "How is fixed-price scoped?", a: "Through a discovery phase that defines scope, milestones, and acceptance criteria." },
      { q: "How do staff augmentation contracts work?", a: "HIGAET engineers integrate with client teams; ownership stays with the client." },
      { q: "What reporting do you provide?", a: "Sprint reports, milestone burndowns, and quarterly stakeholder reviews — adapted to engagement size." },
      { q: "How are rate cards structured?", a: "By role, seniority, and geography — disclosed transparently." },
      { q: "Do you support hybrid models?", a: "Yes — many engagements blend a dedicated core with project-based add-ons." },
    ],
  },

  "tech-industry-solutions": {
    clusterId: "tech-industry-solutions",
    path: "/technologies/case-studies",
    heading: "Industry solutions & proof",
    overview:
      "Case studies showing outcomes across industries — applied AI deployments, enterprise software builds, digital transformation, and AI-powered marketing systems. Each case study includes scope, approach, and measurable result.",
    audience: [
      "Buyers researching delivery partners",
      "Industry leaders benchmarking AI adoption",
      "Analysts mapping HIGAET's portfolio",
      "Internal teams sharing reference architectures",
    ],
    useCases: [
      { title: "AI deployment evidence", body: "Production AI examples across industries." },
      { title: "Enterprise software builds", body: "Large bespoke engineering programs." },
      { title: "Transformation outcomes", body: "Multi-year modernization with sequenced delivery." },
      { title: "AI marketing systems", body: "MarTech and growth-engineering case studies." },
      { title: "Reference architectures", body: "Patterns reused across new engagements." },
    ],
    workflow: [
      { step: "1. Browse by industry", body: "Filter case studies by sector." },
      { step: "2. Browse by engagement model", body: "See how each engagement model played out." },
      { step: "3. Review outcomes", body: "Read scope, approach, and measurable results." },
      { step: "4. Talk to a solutions architect", body: "Map a similar approach to your context." },
    ],
    adaptations: [
      { persona: "Regulated industries", body: "Compliance, audit, and security-first delivery." },
      { persona: "Consumer-facing brands", body: "Performance, personalization, and growth engineering." },
      { persona: "B2B enterprises", body: "Workflow automation and decision intelligence." },
    ],
    tools: [
      { feature: "Case study library", body: "Searchable by industry, model, and capability." },
      { feature: "Solutions architecture call", body: "Talk to an architect about a similar engagement." },
    ],
    faqs: [
      { q: "Are case studies anonymized?", a: "Some are named; others are anonymized where client confidentiality applies." },
      { q: "Can I get reference calls?", a: "Yes — references can be arranged under mutual NDA for active opportunities." },
      { q: "How recent are the case studies?", a: "We refresh the library regularly; each case carries delivery dates." },
      { q: "Do you have industry-specific reference architectures?", a: "Yes — including financial services, healthcare, education, retail, and manufacturing." },
      { q: "Can a case study become a starting template?", a: "Yes — reference architectures are deliberately designed to be reused." },
      { q: "Are outcomes verifiable?", a: "Outcomes are sourced from delivery telemetry and client sign-off." },
      { q: "Do you publish failure post-mortems?", a: "Selected post-mortems are shared under NDA; learnings flow into our reference patterns." },
      { q: "Where can I talk to a solutions architect?", a: "Through the Technologies contact form — pick a time and outline the use case." },
    ],
  },
};

export function getHubLongform(clusterId: ClusterId): HubLongform | null {
  return HUB_LONGFORM[clusterId] ?? null;
}
