import {
  Users,
  UserPlus,
  FileCheck,
  Clock,
  Globe2,
  Repeat,
  type LucideIcon,
} from "lucide-react";
import type { QA } from "@/components/site/FAQ";
import type { ProcessStep } from "@/components/site/ProcessTimeline";

export type EngagementContent = {
  slug: string;
  path: string;
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  subtitle: string;
  tagline: string;
  metaTitle: string;
  metaDescription: string;
  heroHighlights: string[];
  overview: string;
  whenToChoose: string[];
  benefits: { title: string; body: string }[];
  process: ProcessStep[];
  teamStructure: { role: string; body: string }[];
  delivery: string[];
  pricing: { model: string; body: string }[];
  bestFor: string;
  related: { name: string; href: string; body: string }[];
  faqs: QA[];
  ctaTitle: string;
  ctaBody: string;
};

const RELATED_SERVICES = [
  { name: "Custom Software Development", href: "/technologies/custom-software-development", body: "Bespoke engineering for differentiating products and platforms." },
  { name: "AI Solutions", href: "/technologies/ai-solutions", body: "Production-grade AI, LLM, and automation systems." },
  { name: "Cloud Solutions", href: "/technologies/cloud-solutions", body: "Cloud-native architecture on AWS, Azure, and GCP." },
];

export const ENGAGEMENT_MODELS: Record<string, EngagementContent> = {
  "dedicated-development-team": {
    slug: "dedicated-development-team",
    path: "/technologies/engagement/dedicated-development-team",
    icon: Users,
    eyebrow: "Dedicated Development Team",
    title: "A senior squad that becomes a true extension of your roadmap.",
    subtitle: "A long-running, full-time HIGAET pod — product, design, engineering, QA, and DevOps — that you direct like in-house staff while we handle hiring, retention, and HR overhead.",
    tagline: "Long-term, full-time pod under your direction.",
    metaTitle: "Dedicated Development Team | HIGAET Technologies Engagement Model",
    metaDescription: "Hire a long-term, full-time dedicated development team from HIGAET Technologies. Senior product, design, engineering, QA, and DevOps talent on your roadmap.",
    heroHighlights: ["Full-time, long-term squad", "Direct prioritization & standups", "Senior, low-churn engineers"],
    overview: "A Dedicated Development Team is the right choice when your product roadmap is multi-quarter, requirements evolve continuously, and you need durable institutional knowledge inside the team. You set priorities; we provide the squad, leadership, delivery rituals, and the operating system that keeps it shipping.",
    whenToChoose: [
      "You have a multi-quarter or multi-year roadmap and want stable velocity.",
      "Requirements evolve frequently and you need a team embedded in your context.",
      "You want to scale engineering capacity faster than direct hiring allows.",
      "You need senior product and architecture leadership, not just developers.",
    ],
    benefits: [
      { title: "Predictable velocity", body: "A stable, long-running squad with low context-switching ships more, more reliably, quarter over quarter." },
      { title: "Deep domain knowledge", body: "The team owns your codebase, decisions, and constraints — no repeated ramp-up tax." },
      { title: "Faster than hiring", body: "Stand up a vetted senior squad in weeks, not the 6–9 months a comparable in-house build takes." },
      { title: "Single accountable partner", body: "One delivery lead owns outcomes — roadmap, hiring, retention, performance, and reporting." },
      { title: "Flexible scaling", body: "Grow or reshape the squad as priorities shift, without severance or recruiter fees." },
      { title: "Built-in governance", body: "NDAs, IP assignment, security baselines, and audit-ready reporting on every engagement." },
    ],
    process: [
      { title: "Discovery & shape", body: "We map your product, roadmap, stack, and operating model so we propose the right squad shape, not a generic template.", deliverables: ["Roadmap review", "Team shape proposal", "Engagement charter"] },
      { title: "Squad assembly", body: "We assemble a senior pod — typically tech lead, engineers, QA, designer, DevOps — vetted against your stack and domain.", deliverables: ["Profiles & interviews", "Onboarding plan"] },
      { title: "Onboarding & ramp", body: "Two-week structured onboarding into your codebase, tools, rituals, and definition of done.", deliverables: ["Working agreements", "Definition of done"] },
      { title: "Steady-state delivery", body: "Sprints, demos, retros, and quarterly business reviews — your roadmap, our delivery operating system.", deliverables: ["Sprint cadence", "QBR pack"] },
      { title: "Scale & evolve", body: "We reshape the squad as your roadmap shifts — add AI, mobile, or SRE specialists without a new contract.", deliverables: ["Headcount plan", "Skill matrix"] },
    ],
    teamStructure: [
      { role: "Engagement Lead", body: "Accountable for outcomes, contract health, escalations, and the QBR cadence." },
      { role: "Tech Lead / Architect", body: "Owns architecture, code quality, technical risk, and hiring bar inside the squad." },
      { role: "Product / Delivery Manager", body: "Runs discovery, backlog, ceremonies, and stakeholder communication with your team." },
      { role: "Senior Engineers (3–8)", body: "Full-stack, mobile, AI, or data engineers matched to your stack and roadmap." },
      { role: "QA / SDET", body: "Manual and automated testing, release gating, and quality metrics ownership." },
      { role: "DevOps / SRE", body: "CI/CD, infra-as-code, observability, on-call, and cost optimization." },
      { role: "UX / Product Designer", body: "Research, flows, interaction design, and design system stewardship as needed." },
    ],
    delivery: [
      "Two-week sprints with planning, demo, retro, and weekly stakeholder check-ins.",
      "Shared backlog, board, and definition of done — fully transparent in your tooling.",
      "CI/CD with trunk-based development, code review SLAs, and security scanning baked in.",
      "Quarterly Business Reviews covering outcomes, velocity, risks, and roadmap.",
      "On-call rotation and incident response for production-grade systems.",
    ],
    pricing: [
      { model: "Monthly retainer per role", body: "Transparent monthly fee per seat, blended for the squad shape you choose. No hidden bench costs." },
      { model: "Quarterly minimum commitment", body: "We commit to your stability; you commit to the squad for at least one quarter at a time." },
      { model: "Volume & duration discounts", body: "Larger squads and multi-year engagements receive structured discounts." },
    ],
    bestFor: "Product companies, scale-ups, and enterprises that need durable engineering capacity tied to a long-term roadmap.",
    related: RELATED_SERVICES,
    faqs: [
      { q: "How is this different from staff augmentation?", a: "A dedicated team is a managed, self-organising squad with a tech lead, delivery manager, and shared ways of working. Staff augmentation gives you individuals embedded in your own team. We offer both; the right choice depends on whether you need a turnkey unit or extra hands." },
      { q: "Can we interview every engineer?", a: "Yes. We shortlist senior candidates and you run final-round technical and culture interviews. We never place someone you have not approved." },
      { q: "Who owns the IP and source code?", a: "You do. All work product and IP are assigned to you under the MSA, and we work in your repositories with your tooling." },
      { q: "What if we need to scale down?", a: "We agree a minimum quarterly commitment, after which the squad can grow, shrink, or change shape with 30 days' notice." },
      { q: "How do you prevent attrition?", a: "Senior compensation, career paths through the HIGAET Academy, low utilisation pressure, and rotating challenges keep our retention well above industry average." },
    ],
    ctaTitle: "Stand up a senior squad on your roadmap.",
    ctaBody: "Tell us about your product and timeline — we'll come back with a recommended squad shape, profiles, and a 30/60/90 plan within one business day.",
  },

  "staff-augmentation": {
    slug: "staff-augmentation",
    path: "/technologies/engagement/staff-augmentation",
    icon: UserPlus,
    eyebrow: "Staff Augmentation",
    title: "Senior engineers embedded directly in your team.",
    subtitle: "Plug vetted HIGAET engineers, designers, and specialists into your existing squads. They report to your leads, work in your tooling, and ramp up in days.",
    tagline: "Vetted specialists embedded in your team.",
    metaTitle: "IT Staff Augmentation Services | HIGAET Technologies",
    metaDescription: "Augment your engineering team with senior, vetted HIGAET specialists. Flexible IT staff augmentation across React, Node, Python, AI, cloud, mobile, and data.",
    heroHighlights: ["Vetted senior specialists", "Embedded in your squads", "Ramp up in days, not months"],
    overview: "Staff augmentation is the right model when you have a strong in-house team and a clear delivery process, but need targeted senior capacity — to hit a release, cover a parental leave, or add a specialist skill you do not want to hire full-time.",
    whenToChoose: [
      "Your team is fully formed but capacity-constrained for a defined window.",
      "You need a specialist skill (AI, mobile, SRE) for a specific initiative.",
      "Hiring permanently would take longer than the work itself.",
      "You want full control over priorities, code review, and ceremonies.",
    ],
    benefits: [
      { title: "Fast ramp-up", body: "Vetted specialists onboarded into your stack and rituals in days, not the months a permanent hire requires." },
      { title: "Full control", body: "Engineers report to your leads, attend your standups, and follow your code review and security standards." },
      { title: "Flexible commitment", body: "Engage for one quarter or several, scale up and down without recruiter fees or severance." },
      { title: "Quality bar", body: "Every engineer passes a multi-stage technical, system design, and culture screen before we propose them." },
      { title: "Specialist depth", body: "Access niche skills — LLMs, data engineering, iOS, Kubernetes — without paying for an internal capability you only need once." },
      { title: "Backed by a bench", body: "If an engineer needs to step away, we have a vetted backup ready, not a recruiter starting from zero." },
    ],
    process: [
      { title: "Role definition", body: "We refine the role, seniority, stack, and success criteria so the shortlist is sharp from the start.", deliverables: ["Role brief", "Success criteria"] },
      { title: "Shortlist & interview", body: "You receive 2–3 profiles within a week and run technical and culture interviews directly.", deliverables: ["Vetted profiles", "Interview support"] },
      { title: "Onboarding", body: "We pair the engineer with your tech lead, set up access, and define the first two weeks of work.", deliverables: ["Onboarding plan"] },
      { title: "Ongoing performance", body: "Weekly check-ins between HIGAET, your lead, and the engineer to surface blockers and growth areas.", deliverables: ["Performance reviews"] },
      { title: "Roll-off or extend", body: "Clean knowledge transfer at the end of the engagement, or extension when there is more work to do.", deliverables: ["Handover doc"] },
    ],
    teamStructure: [
      { role: "Individual contributors", body: "Senior engineers, designers, QA, or DevOps specialists embedded into your squads." },
      { role: "Optional tech lead", body: "Add a HIGAET tech lead to coordinate multi-person augmentation and unblock the team." },
      { role: "HIGAET account manager", body: "One point of contact for contracting, performance, replacement, and escalation." },
    ],
    delivery: [
      "Engineers work fully inside your processes, tooling, and ceremonies.",
      "Weekly 1:1 between your tech lead and our account manager keeps performance on track.",
      "Replacement guarantee: if an engineer is not the right fit in the first two weeks, we replace them at no cost.",
      "Time tracking and reporting in your preferred system; monthly invoicing.",
    ],
    pricing: [
      { model: "Monthly rate per role", body: "Flat monthly rate per engineer based on seniority and skill, billed monthly with one month's notice." },
      { model: "Hourly for short engagements", body: "Hourly billing for engagements under 3 months or with variable utilization." },
      { model: "Volume discounts", body: "Discounted rates beyond 5 augmented engineers." },
    ],
    bestFor: "Established product and engineering teams that need targeted senior capacity for a defined window.",
    related: RELATED_SERVICES,
    faqs: [
      { q: "How quickly can someone start?", a: "Typical time from signed brief to engineer onboarded is 2–3 weeks for mainstream roles and 4–6 weeks for niche AI or data engineering specialists." },
      { q: "Can we hire the engineer permanently later?", a: "Yes, after a six-month engagement we offer a defined buy-out path that converts the contractor into your full-time employee." },
      { q: "Who manages performance?", a: "Day-to-day, your tech lead does. HIGAET runs structured weekly check-ins to address any concerns and provide career coaching." },
      { q: "What if the engineer is not a fit?", a: "We replace them at no cost within the first two weeks; afterwards, replacement happens within 30 days." },
    ],
    ctaTitle: "Add senior capacity to your team this month.",
    ctaBody: "Tell us the role, stack, and timeline. You will see two or three vetted profiles within a week and have an engineer onboarded in two to three.",
  },

  "fixed-price-projects": {
    slug: "fixed-price-projects",
    path: "/technologies/engagement/fixed-price-projects",
    icon: FileCheck,
    eyebrow: "Fixed Price Projects",
    title: "Defined scope, defined timeline, defined budget.",
    subtitle: "When you need a specific outcome — an MVP, a migration, a redesign — with a hard budget and a fixed date, we deliver it as a fixed-price engagement underpinned by a rigorous discovery.",
    tagline: "Defined scope, timeline, and budget.",
    metaTitle: "Fixed Price Software Development | HIGAET Technologies",
    metaDescription: "Deliver a defined outcome with a fixed price, fixed timeline, and milestone-based payments. Ideal for MVPs, migrations, redesigns, and well-scoped builds.",
    heroHighlights: ["Fixed scope, price, and date", "Milestone-based payments", "Discovery-first approach"],
    overview: "Fixed price works when the scope can be specified clearly upfront — usually after a paid discovery — and the trade-off between scope, time, and cost is something you want to lock down. We accept the delivery risk; in return, the scope is held firm and changes go through a formal change-control process.",
    whenToChoose: [
      "The outcome is well understood and can be specified in a written scope.",
      "You have a hard budget approval and a non-negotiable launch date.",
      "Stakeholders need certainty more than flexibility.",
      "The work has clear acceptance criteria.",
    ],
    benefits: [
      { title: "Budget certainty", body: "Approved budget at the start, no surprise variations unless you formally change scope." },
      { title: "Date certainty", body: "Milestones with hard dates and incentives aligned to on-time delivery." },
      { title: "Risk transfer", body: "Delivery risk sits with HIGAET, not your team or your CFO." },
      { title: "Discovery-first rigor", body: "A paid discovery phase de-risks the scope before we commit to a fixed price." },
      { title: "Milestone-based cashflow", body: "Pay on accepted milestones, keeping financial control and easy stakeholder reporting." },
      { title: "Clean acceptance", body: "Each milestone has explicit acceptance criteria and demo, eliminating ambiguity." },
    ],
    process: [
      { title: "Paid discovery", body: "A 2–6 week discovery captures requirements, architecture, designs, and a verified estimate. You own the artefacts whether or not you proceed.", deliverables: ["SRS / scope", "Architecture", "Hi-fi designs", "Plan & estimate"] },
      { title: "Statement of work", body: "We produce a SoW with fixed price, milestone schedule, acceptance criteria, assumptions, and change-control process.", deliverables: ["Signed SoW"] },
      { title: "Build sprints", body: "Two-week sprints with bi-weekly demos against the milestone plan; you sign off at each milestone.", deliverables: ["Working software"] },
      { title: "UAT & launch", body: "User acceptance testing against the agreed criteria, then a coordinated launch with hypercare support.", deliverables: ["UAT report", "Launch plan"] },
      { title: "Warranty period", body: "30–90 days post-launch warranty covering defects against the agreed acceptance criteria.", deliverables: ["Warranty support"] },
    ],
    teamStructure: [
      { role: "Engagement Lead", body: "Owns scope, change control, and stakeholder reporting." },
      { role: "Solution Architect", body: "Owns technical solution and quality gates across milestones." },
      { role: "Project Manager", body: "Plan, risk, and milestone tracking with weekly status reports." },
      { role: "Squad", body: "Right-sized team of engineers, designers, and QA — assembled for the scope." },
    ],
    delivery: [
      "Milestones every 2–4 weeks with formal acceptance gates.",
      "Weekly status reports covering progress, risks, decisions needed, and burn.",
      "Formal change request process for scope adjustments; price and date adjust accordingly.",
      "30–90 day post-launch warranty included.",
    ],
    pricing: [
      { model: "Fixed total price", body: "One number, agreed in the SoW, with payment split across milestones." },
      { model: "Discovery billed separately", body: "Paid discovery on time-and-materials to produce a defensible fixed price." },
      { model: "Change requests", body: "Scope additions priced and approved in writing before work begins." },
    ],
    bestFor: "Funded MVPs, replatformings, integrations, redesigns, and any project with hard date and budget constraints.",
    related: RELATED_SERVICES,
    faqs: [
      { q: "Why is discovery paid?", a: "A meaningful fixed price needs real architecture, designs, and validation. Free discovery either rushes that work or shifts the cost into inflated project estimates." },
      { q: "What if requirements change mid-flight?", a: "Small adjustments are absorbed by a contingency budget. Substantive changes go through change control with a clear impact on price or date." },
      { q: "Is fixed price always cheaper?", a: "Not necessarily. You pay for certainty. For evolving scope, time-and-materials or a dedicated team is typically more efficient." },
      { q: "How granular are milestones?", a: "We aim for milestones every 2–4 weeks, each delivering working software you can demo, not just documents." },
    ],
    ctaTitle: "Lock in scope, date, and budget.",
    ctaBody: "Share the brief and we'll propose a discovery plan and indicative price range within one business day.",
  },

  "time-and-materials": {
    slug: "time-and-materials",
    path: "/technologies/engagement/time-and-materials",
    icon: Clock,
    eyebrow: "Time & Materials",
    title: "Maximum flexibility for evolving products.",
    subtitle: "Pay for the senior capacity you actually use, with the freedom to reshape priorities, scope, and team composition sprint by sprint.",
    tagline: "Flexible, transparent, sprint-by-sprint.",
    metaTitle: "Time and Materials Software Development | HIGAET Technologies",
    metaDescription: "Engage HIGAET Technologies on a time and materials basis. Transparent billing, flexible scope, senior squads — ideal for evolving products and research-heavy work.",
    heroHighlights: ["Sprint-by-sprint flexibility", "Transparent timesheets", "Reshape scope anytime"],
    overview: "Time-and-materials is the right model when scope, priorities, or technical approach are expected to evolve — which is true of most modern product work. You get a senior squad, transparent reporting, and the freedom to steer the work without renegotiating a contract every time a hypothesis changes.",
    whenToChoose: [
      "Requirements will evolve as you learn from users.",
      "The product is in early discovery, validation, or research mode.",
      "You want to start quickly without locking down a full SoW.",
      "You value flexibility over price-and-date certainty.",
    ],
    benefits: [
      { title: "Adapt to learning", body: "Re-prioritise sprint to sprint as user research and metrics reveal what matters." },
      { title: "Pay for value", body: "Billed only for capacity used, with detailed timesheets and a monthly review." },
      { title: "Fast start", body: "Begin within weeks; lightweight Master Services Agreement plus a short statement of work." },
      { title: "Senior team, no bench tax", body: "Same vetted senior engineers we put on dedicated teams — no padded estimates." },
      { title: "Transparent reporting", body: "Daily activity logs, weekly burndowns, monthly invoices with full traceability." },
      { title: "Easy scope expansion", body: "Add or swap skills (AI, mobile, data) as the work evolves, with no contract renegotiation." },
    ],
    process: [
      { title: "Lightweight kickoff", body: "Two-page SoW with rates, capacity, working agreement, and the first sprint goal — signed in days, not weeks.", deliverables: ["SoW", "Working agreement"] },
      { title: "Sprint zero", body: "Set up backlog, tooling, environments, and rituals; agree the first measurable outcomes.", deliverables: ["Backlog", "Definitions of ready & done"] },
      { title: "Iterate", body: "Two-week sprints with planning, demo, retro; you steer priorities sprint to sprint.", deliverables: ["Working software"] },
      { title: "Monthly review", body: "Monthly review of outcomes, burn, and trajectory; adjust team shape and capacity if needed.", deliverables: ["Monthly report"] },
      { title: "Wind down or transition", body: "When you choose to stop, we run a clean handover; or transition into a Dedicated Team for long-term work.", deliverables: ["Handover doc"] },
    ],
    teamStructure: [
      { role: "Tech Lead", body: "Owns architecture decisions and quality across the squad." },
      { role: "Senior Engineers", body: "Full-stack, mobile, AI, or data engineers matched to current priorities." },
      { role: "QA / Designer (as needed)", body: "Added or rotated in based on the sprint goals." },
      { role: "Delivery Manager", body: "Backlog, ceremonies, and reporting; lightweight by design." },
    ],
    delivery: [
      "Two-week sprints with planning, demo, retro, and clear sprint goals.",
      "Daily standups in your channel; weekly burndown and risks update.",
      "Detailed timesheets per engineer; monthly billing on actuals.",
      "Right to swap roles or change capacity with two weeks' notice.",
    ],
    pricing: [
      { model: "Hourly or daily rates", body: "Senior rate card by role and seniority, blended into a clear monthly burn." },
      { model: "Monthly cap (optional)", body: "Optional monthly spend cap for finance comfort; we flag at 80% utilisation." },
      { model: "No bench charges", body: "You pay only for hours worked on your product — never for downtime, recruiting, or admin." },
    ],
    bestFor: "Product teams in discovery or rapid iteration mode, R&D initiatives, and any work where flexibility matters more than fixed price.",
    related: RELATED_SERVICES,
    faqs: [
      { q: "How do you prevent runaway costs?", a: "Sprint goals, monthly caps, weekly burndowns, and a formal escalation if forecast spend exceeds the cap. You always know where the burn is going." },
      { q: "Do we get the same engineers every sprint?", a: "Yes. T&M does not mean rotating contractors. You get the same senior squad, with the freedom to change roles when priorities change." },
      { q: "Can we convert to a fixed price later?", a: "Yes, once scope stabilises. We frequently start T&M and transition to a Dedicated Team or a fixed-price phase for launch work." },
      { q: "What rates apply?", a: "Senior rates by role, agreed in the SoW. Rates do not change mid-engagement except by mutual agreement at annual review." },
    ],
    ctaTitle: "Start sprinting in weeks, not quarters.",
    ctaBody: "Tell us the product and the next outcome; we'll propose a squad shape, rates, and a sprint-one plan within one business day.",
  },

  "offshore-development-center": {
    slug: "offshore-development-center",
    path: "/technologies/engagement/offshore-development-center",
    icon: Globe2,
    eyebrow: "Offshore Development Center",
    title: "Your own engineering center, run by HIGAET.",
    subtitle: "A dedicated offshore unit — branded as yours where useful — with engineering, QA, DevOps, data, and AI capability under a single delivery operating model.",
    tagline: "Your branded offshore unit, fully managed.",
    metaTitle: "Offshore Development Center (ODC) | HIGAET Technologies",
    metaDescription: "Set up a dedicated Offshore Development Center with HIGAET Technologies. Senior squads, governance, and your branding — without the cost of opening your own entity.",
    heroHighlights: ["10+ engineer dedicated unit", "Optional client branding", "Single delivery operating model"],
    overview: "An Offshore Development Center (ODC) gives you the strategic benefits of running your own engineering hub — scale, cost structure, talent access — without the multi-year cost and risk of incorporating, leasing, recruiting, and managing the operation yourself. HIGAET runs the operation; you set the roadmap.",
    whenToChoose: [
      "You need 10+ engineers across multiple disciplines on a multi-year horizon.",
      "You want a structural cost advantage versus onshore hiring.",
      "You want a single, governed unit rather than scattered contractors.",
      "You eventually want the option to insource the unit.",
    ],
    benefits: [
      { title: "Scale fast, derisked", body: "Stand up 10–100+ engineers in months, with HIGAET absorbing hiring, real estate, HR, and compliance risk." },
      { title: "Structural cost advantage", body: "Blended senior rates well below onshore equivalents, without sacrificing quality or governance." },
      { title: "One operating model", body: "Engineering, QA, DevOps, data, and AI under one delivery system — not a portfolio of vendors to coordinate." },
      { title: "Your brand if you want it", body: "We can run the ODC under your brand, including LinkedIn, recruiting materials, and office branding." },
      { title: "Built-in governance", body: "ISMS, SOC 2-aligned controls, audit logs, IP assignment, and quarterly executive reviews." },
      { title: "Insourcing optionality", body: "Defined long-term option to convert the ODC to your own legal entity and team." },
    ],
    process: [
      { title: "Strategy & charter", body: "Define the ODC's mission, capabilities, KPIs, governance, and 12-month ramp plan.", deliverables: ["ODC charter", "Ramp plan"] },
      { title: "Setup", body: "Office space, security, tooling, and HR processes set up to your standards.", deliverables: ["Workspace", "Security baseline"] },
      { title: "Hiring & ramp", body: "Wave-by-wave hiring with you in the loop for senior roles; structured onboarding for each wave.", deliverables: ["Hiring waves", "Onboarding playbook"] },
      { title: "Steady-state operations", body: "Squads on your roadmap with delivery, quality, and security metrics reviewed monthly.", deliverables: ["Monthly ops review"] },
      { title: "Executive cadence", body: "Quarterly Business Reviews and an annual strategy refresh keep the ODC aligned to your direction.", deliverables: ["QBR pack", "Annual review"] },
    ],
    teamStructure: [
      { role: "ODC Director", body: "Single accountable executive owning delivery, governance, and your relationship." },
      { role: "Engineering Leads", body: "Per-squad tech leads owning architecture, hiring bar, and quality." },
      { role: "Practice Heads", body: "Heads of QA, DevOps, data, and AI driving cross-squad standards." },
      { role: "Delivery Managers", body: "Run the cadence, reporting, and stakeholder communications." },
      { role: "Squads", body: "5–9 person squads aligned to your products, roadmaps, or platforms." },
      { role: "Shared services", body: "Talent, HR, finance, IT, and security — fully managed by HIGAET." },
    ],
    delivery: [
      "Squad-based delivery aligned to your products or platforms.",
      "Centralised practices for quality, security, observability, and engineering excellence.",
      "Monthly operational reviews and quarterly executive reviews.",
      "Defined service levels for hiring time, attrition, delivery quality, and security incidents.",
    ],
    pricing: [
      { model: "Monthly blended rate per role", body: "Transparent rate card with discounts that grow with the size and duration of the ODC." },
      { model: "Setup fee", body: "One-time setup covering hiring, infrastructure, and onboarding for the first wave." },
      { model: "Optional buy-out", body: "Defined long-term option to transfer the ODC to your legal entity at pre-agreed terms." },
    ],
    bestFor: "Scale-ups and enterprises that need to grow engineering capacity at a structural cost advantage with strong governance.",
    related: RELATED_SERVICES,
    faqs: [
      { q: "How is an ODC different from a Dedicated Team?", a: "A Dedicated Team is one squad. An ODC is a multi-squad operation with shared services, leadership, governance, and KPIs — designed to scale to 20–100+ engineers." },
      { q: "Can we visit and audit the ODC?", a: "Yes. Site visits, audits, and joint executive reviews are part of the engagement, not exceptions." },
      { q: "Can we eventually own the ODC?", a: "Yes. We agree a buy-out path in the MSA, with valuation formula and transfer process defined upfront." },
      { q: "How long to set one up?", a: "Typically 3–6 months from charter to first productive squad, with subsequent waves every 6–10 weeks." },
    ],
    ctaTitle: "Build your own engineering hub, with us running it.",
    ctaBody: "Tell us the scale and horizon; we'll respond with a charter outline, ramp plan, and indicative economics within two business days.",
  },

  "build-operate-transfer": {
    slug: "build-operate-transfer",
    path: "/technologies/engagement/build-operate-transfer",
    icon: Repeat,
    eyebrow: "Build–Operate–Transfer",
    title: "We build and run the team. You take it in-house when you're ready.",
    subtitle: "A three-phase model — Build, Operate, Transfer — that combines speed of an outsourced setup with the end-state of an owned, in-house engineering capability.",
    tagline: "Build, operate, then transfer to your entity.",
    metaTitle: "Build-Operate-Transfer (BOT) Model | HIGAET Technologies",
    metaDescription: "Stand up an offshore engineering team with HIGAET, run it under our governance, then transfer it to your own legal entity. Predictable BOT economics and timelines.",
    heroHighlights: ["3 phases: build, operate, transfer", "Defined transfer economics", "End-state: your team, your entity"],
    overview: "BOT is the right model when you know you eventually want an owned offshore capability but cannot afford the time, risk, or capital required to do it yourself. We build the team, run it under our governance and brand for an agreed period, then transfer people, contracts, and assets to your legal entity.",
    whenToChoose: [
      "Your board has committed to an owned offshore capability long-term.",
      "You need to start delivering value before incorporation and hiring are realistic.",
      "You want a transparent, pre-agreed transfer economics, not a renegotiation later.",
      "You want HIGAET's hiring brand and operating model to derisk the build phase.",
    ],
    benefits: [
      { title: "Speed in phase one", body: "Productive squads within months — vastly faster than a greenfield entity setup." },
      { title: "Quality compounds", body: "Two to three years of HIGAET operating standards become the DNA of your future in-house team." },
      { title: "Defined end state", body: "Transfer terms, valuation formula, and timeline agreed in the original MSA — no surprises." },
      { title: "Risk transfer in operate phase", body: "We carry HR, legal, real estate, and delivery risk until you choose to take it on." },
      { title: "Talent retention through transfer", body: "Structured retention plan and equity-grade incentives keep the team intact through the transfer." },
      { title: "Optionality preserved", body: "If priorities change, you can extend operate, accelerate transfer, or convert to a long-term ODC." },
    ],
    process: [
      { title: "Phase 1 — Build (3–9 months)", body: "Charter, hiring, infrastructure, and ramp to a productive multi-squad unit under HIGAET governance.", deliverables: ["BOT charter", "Hired squads", "Operating playbook"] },
      { title: "Phase 2 — Operate (12–36 months)", body: "We run the team, meet KPIs, mature practices, and prepare for a clean transfer. You direct the roadmap.", deliverables: ["Monthly ops review", "QBR pack", "Maturity scorecards"] },
      { title: "Transition planning (6 months pre-transfer)", body: "Joint workstream to set up your entity, transfer contracts, IP, and people on a defined date.", deliverables: ["Transfer plan", "Legal / HR workstream"] },
      { title: "Phase 3 — Transfer", body: "Cut-over to your legal entity with retention plans, equity grants, and a transitional services agreement.", deliverables: ["Transfer agreement", "TSA"] },
      { title: "Post-transfer support", body: "Optional 6–12 month support agreement covering escalation, hiring brand, and selected services.", deliverables: ["Support agreement"] },
    ],
    teamStructure: [
      { role: "BOT Director", body: "Single executive owning the full BOT lifecycle through transfer." },
      { role: "Operating leadership", body: "Engineering, delivery, and practice heads who will transfer to your entity at the end of phase 2." },
      { role: "Squads", body: "Engineering squads built specifically for your roadmap and end-state team design." },
      { role: "HIGAET shared services", body: "Talent, HR, finance, IT, and security during the build and operate phases." },
    ],
    delivery: [
      "Squad-based delivery aligned to your roadmap from day one of operate.",
      "Monthly ops review and quarterly executive review.",
      "Annual maturity scorecards across engineering, security, talent, and finance to track transfer readiness.",
      "Defined SLAs for hiring time, attrition, and delivery quality.",
    ],
    pricing: [
      { model: "Build fee", body: "One-time fee covering hiring, infrastructure setup, and onboarding of the first squads." },
      { model: "Monthly operate fee", body: "Per-role monthly fee during the operate phase, comparable to ODC pricing." },
      { model: "Transfer fee", body: "Pre-agreed transfer fee formula, calculated transparently from headcount, tenure, and operate duration." },
    ],
    bestFor: "Enterprises that have committed to an owned offshore capability but need speed, derisking, and a structured path to ownership.",
    related: RELATED_SERVICES,
    faqs: [
      { q: "When is the right time to transfer?", a: "Most clients transfer 18–36 months in, once practices are mature, the team is stable, and the legal/HR setup is ready. We design transfer readiness from day one." },
      { q: "Do the people actually move with the transfer?", a: "Yes, that is the point. We design retention plans and equity-grade incentives so the team transfers intact — typically 90%+ retention through the cut-over." },
      { q: "Is the transfer fee fair?", a: "It is calculated by a formula agreed in the original MSA — typically a multiple of monthly operate fee per transferring head, with reductions for longer operate phases." },
      { q: "What if we never want to transfer?", a: "Then BOT converts to an ODC at pre-agreed terms. The optionality runs both directions." },
    ],
    ctaTitle: "Build your future offshore team without the risk.",
    ctaBody: "Tell us your scale, horizon, and end-state intent; we'll come back with an indicative BOT charter and economics within two business days.",
  },
};

export const ENGAGEMENT_SLUGS = [
  "dedicated-development-team",
  "staff-augmentation",
  "fixed-price-projects",
  "time-and-materials",
  "offshore-development-center",
  "build-operate-transfer",
] as const;
