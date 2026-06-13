// HIGAET Technologies company-section registry.
// Drives the /technologies/company hub, dynamic slug pages, and sitemap.

export type CompanyContent = {
  slug: string;
  path: string;
  group: "About" | "Why" | "Process" | "People";
  eyebrow: string;          // short label for nav
  title: string;            // page H1
  metaTitle: string;
  metaDescription: string;
  intro: string;            // hero subtitle
  summary: string;          // executive summary
  sections: { id: string; heading: string; body: string[]; bullets?: string[] }[];
  highlights?: string[];    // hero highlights
  cta?: { title: string; body: string };
};

export const COMPANY_PAGES: CompanyContent[] = [
  {
    slug: "about",
    path: "/technologies/company/about",
    group: "About",
    eyebrow: "About",
    title: "About HIGAET Technologies",
    metaTitle: "About HIGAET Technologies | Enterprise software & AI partner",
    metaDescription:
      "HIGAET Technologies is the enterprise engineering arm of HIGAET — building AI-native software, cloud platforms, and data products for regulated industries.",
    intro:
      "HIGAET Technologies is the enterprise engineering arm of the HIGAET ecosystem — Academy, Global Education Hub, and Technologies.",
    summary:
      "We help enterprises and ambitious growth companies design, build, and operate AI-native software, cloud platforms, and data products. Our work is concentrated where modern engineering meets regulated reality: finance, healthcare, manufacturing, education, and the public sector.",
    sections: [
      {
        id: "what-we-do",
        heading: "What we do",
        body: [
          "We deliver end-to-end software engineering services — custom platforms, enterprise modernization, applied AI, data infrastructure, and managed product engineering — under engagement models that match how our clients buy.",
          "Every HIGAET Technologies engagement is led by senior engineers and architects, not by account managers. The people responsible for outcomes are the people building.",
        ],
      },
      {
        id: "how-we-work",
        heading: "How we work",
        body: [
          "Small, senior squads. Contract-first APIs. Continuous delivery from day one. Evidence over slideware. Public documentation of trade-offs so executives can make real decisions.",
        ],
        bullets: [
          "Senior-heavy squads (median 8+ years experience)",
          "Reference architectures tested in production, not on paper",
          "Open communication channels with engineering, not gatekeepers",
          "Knowledge transfer baked into the delivery cadence",
        ],
      },
      {
        id: "the-higaet-ecosystem",
        heading: "The wider HIGAET ecosystem",
        body: [
          "Technologies sits alongside HIGAET Academy (engineering and AI education) and HIGAET Global Education Hub (international student services). The ecosystem gives our enterprise work an unusually deep talent pipeline and a strong applied-research connection.",
        ],
      },
    ],
    highlights: ["Senior-led delivery", "AI-native by default", "Regulated-industry experience"],
    cta: {
      title: "Want to work with HIGAET Technologies?",
      body: "Share the problem and the constraints. We'll come back with a credible plan and the right squad.",
    },
  },
  {
    slug: "leadership",
    path: "/technologies/company/leadership",
    group: "People",
    eyebrow: "Leadership",
    title: "Leadership",
    metaTitle: "Leadership — HIGAET Technologies",
    metaDescription:
      "Meet the leadership group behind HIGAET Technologies — engineering, delivery, design, and operations.",
    intro:
      "HIGAET Technologies is led by senior engineers, architects, and operators who have shipped enterprise software at scale.",
    summary:
      "Our leadership group is intentionally light on layers and heavy on practitioners. The people accountable for delivery are still close to the work.",
    sections: [
      {
        id: "structure",
        heading: "How leadership is structured",
        body: [
          "We organise leadership around capability — engineering, delivery, design, platform, and operations — rather than around individual accounts or geographies. That keeps quality bars consistent across engagements.",
        ],
      },
      {
        id: "principles",
        heading: "Principles",
        body: [
          "Leaders at HIGAET Technologies are expected to remain technical, to be reachable by clients and teams, and to make trade-offs visible. Promotions follow contribution to outcomes, not headcount growth.",
        ],
        bullets: [
          "Stay technical — leaders ship and review code",
          "Be reachable — no gatekeepers between clients and engineering",
          "Make trade-offs explicit — buyers deserve to see them",
        ],
      },
      {
        id: "appointments",
        heading: "Named appointments",
        body: [
          "Detailed leadership bios with photography, roles, and prior work history are maintained in our published profiles. We do not publish placeholder bios — appointments are listed here as the team formally announces them.",
        ],
      },
    ],
    cta: {
      title: "Meeting our leadership team",
      body: "Senior leaders join client conversations during the engagement-shaping phase, not only at kickoff. Reach out and we'll set up the right meeting.",
    },
  },
  {
    slug: "mission",
    path: "/technologies/company/mission",
    group: "About",
    eyebrow: "Mission",
    title: "Our mission",
    metaTitle: "Mission — HIGAET Technologies",
    metaDescription:
      "HIGAET Technologies exists to make modern, AI-native engineering accessible to enterprises that need to ship under real-world constraints.",
    intro: "To make modern, AI-native engineering practical for enterprises that operate under real-world constraints.",
    summary:
      "Most enterprises do not need cutting-edge research. They need cutting-edge engineering applied with discipline, in environments that have compliance, legacy, and people considerations. HIGAET Technologies exists to do that work.",
    sections: [
      {
        id: "what-this-means",
        heading: "What this means in practice",
        body: [
          "We prefer durable architecture over fashionable architecture. We prefer evaluation harnesses over demos. We prefer fewer, better engineers over larger, weaker teams.",
        ],
      },
      {
        id: "who-this-is-for",
        heading: "Who this is for",
        body: [
          "Enterprise leaders, regulated-industry CTOs, and product organisations that have decided modernisation is a multi-year capability, not a one-off project.",
        ],
      },
    ],
  },
  {
    slug: "vision",
    path: "/technologies/company/vision",
    group: "About",
    eyebrow: "Vision",
    title: "Our vision",
    metaTitle: "Vision — HIGAET Technologies",
    metaDescription:
      "A vision of enterprise engineering where AI, data, and cloud are first-class citizens — and where the people who build the systems also operate them.",
    intro: "Enterprise engineering where AI, data, and cloud are first-class citizens, not bolt-ons.",
    summary:
      "Within a decade, the line between 'software' and 'AI software' will disappear inside the enterprise. Our vision is to be one of the firms enterprises trust to make that transition without breaking the business in the process.",
    sections: [
      {
        id: "where-we-are-heading",
        heading: "Where we are heading",
        body: [
          "Toward AI-native delivery: software whose evaluation, observability, and lifecycle are designed around probabilistic components from day one. Toward platforms that survive reorgs. Toward documentation that machines can read.",
        ],
      },
    ],
  },
  {
    slug: "values",
    path: "/technologies/company/values",
    group: "About",
    eyebrow: "Values",
    title: "Our values",
    metaTitle: "Values — HIGAET Technologies",
    metaDescription:
      "The values HIGAET Technologies hires for and operates by: candour, craft, ownership, and durable outcomes for clients.",
    intro: "What we hire for, promote on, and refuse to compromise.",
    summary:
      "Values that are easy to write are easy to ignore. Ours are operationalised in how we hire, how we promote, and how we structure engagements.",
    sections: [
      {
        id: "candour",
        heading: "Candour over comfort",
        body: [
          "We tell clients what we actually think, including when the answer is 'do not build this'. Engagements built on flattery do not survive their first hard quarter.",
        ],
      },
      {
        id: "craft",
        heading: "Craft as default",
        body: [
          "We assume senior-grade quality, then add review rituals to keep it there. The bar is the same on day one of an engagement and on day five hundred.",
        ],
      },
      {
        id: "ownership",
        heading: "Ownership all the way down",
        body: [
          "Engineers own their code in production. Squads own their outcomes. Leaders own their squads' outcomes. There is no 'someone else's problem' layer.",
        ],
      },
      {
        id: "durable",
        heading: "Durable outcomes",
        body: [
          "We optimise for the system the client will still be running in three years, not for the demo at the end of the engagement.",
        ],
      },
    ],
  },
  {
    slug: "culture",
    path: "/technologies/company/culture",
    group: "People",
    eyebrow: "Culture",
    title: "Company culture",
    metaTitle: "Culture — HIGAET Technologies",
    metaDescription:
      "Inside the HIGAET Technologies culture: senior-heavy teams, written communication, time for craft, and a strong learning practice.",
    intro: "How HIGAET Technologies actually feels from the inside.",
    summary:
      "Culture shows up in how meetings are run, how decisions are made, and how time is spent — not in posters. The notes below describe what HIGAET Technologies is like to work in.",
    sections: [
      {
        id: "written-first",
        heading: "Written-first communication",
        body: [
          "Important decisions are written down before they are agreed. Asynchronous review is the default; meetings exist to resolve, not to inform.",
        ],
      },
      {
        id: "craft-time",
        heading: "Time for craft",
        body: [
          "We protect a recurring slice of the calendar for refactoring, tooling, and learning. Engineering quality cannot only happen between feature deadlines.",
        ],
      },
      {
        id: "learning",
        heading: "Continuous learning",
        body: [
          "Engineers rotate through internal study groups, contribute to HIGAET Academy, and have a learning budget that does not require approval theatre.",
        ],
      },
    ],
  },
  {
    slug: "why-higaet-technologies",
    path: "/technologies/company/why-higaet-technologies",
    group: "Why",
    eyebrow: "Why HIGAET",
    title: "Why HIGAET Technologies",
    metaTitle: "Why HIGAET Technologies | Enterprise engineering partner",
    metaDescription:
      "Why enterprises choose HIGAET Technologies: senior-heavy teams, regulated-industry experience, transparent delivery, and AI-native engineering.",
    intro: "The reasons enterprises pick HIGAET Technologies — described honestly.",
    summary:
      "We do not claim to be the right partner for everyone. The points below describe the specific situations where HIGAET Technologies is a strong choice.",
    sections: [
      {
        id: "senior-heavy",
        heading: "Senior-heavy delivery",
        body: [
          "Our default squad shape skews senior. Median engineer experience on enterprise engagements is over eight years. Architects and tech leads stay on the engagement, not just at the kickoff.",
        ],
      },
      {
        id: "regulated",
        heading: "Regulated-industry literacy",
        body: [
          "We have shipped into finance, healthcare, government, and manufacturing under audit. We know what auditors want, and we wire it into the pipeline instead of producing evidence at the end.",
        ],
      },
      {
        id: "ai-native",
        heading: "AI-native engineering",
        body: [
          "Generative AI is part of the default toolkit — used responsibly, evaluated rigorously, governed properly. It does not arrive as a separate workstream; it is part of how we build.",
        ],
      },
      {
        id: "transparent",
        heading: "Transparent delivery",
        body: [
          "Clients see real backlogs, real metrics, and real trade-offs. We publish architecture decisions, cost models, and risk logs as artefacts, not as occasional slides.",
        ],
      },
    ],
    highlights: ["Senior-led", "Audit-ready", "AI-native", "Transparent"],
  },
  {
    slug: "development-methodology",
    path: "/technologies/company/development-methodology",
    group: "Process",
    eyebrow: "Methodology",
    title: "Development methodology",
    metaTitle: "Development methodology — HIGAET Technologies",
    metaDescription:
      "How HIGAET Technologies runs delivery: lean agile, continuous integration, evidence-based release management, and disciplined engineering practices.",
    intro: "A lean, evidence-driven take on agile delivery — tuned for enterprise constraints.",
    summary:
      "We follow agile principles with discipline, not as ceremony. The methodology below is the same one we run on regulated, on-premise, and SaaS engagements.",
    sections: [
      {
        id: "discovery",
        heading: "Discovery & shape",
        body: [
          "Every engagement starts with a short, paid discovery: stakeholder interviews, system review, risk log, and a recommended shape with options. No 'free pitch' theatre.",
        ],
      },
      {
        id: "delivery",
        heading: "Delivery cadence",
        body: [
          "Two-week iterations, with a continuously updated roadmap and a public risk log. Stand-ups are short and asynchronous. Reviews are demos against acceptance criteria, not slideware.",
        ],
        bullets: [
          "Trunk-based development with feature flags",
          "Continuous integration; release on demand",
          "Automated tests as a release gate, not a suggestion",
          "Architecture Decision Records (ADRs) for every meaningful choice",
        ],
      },
      {
        id: "handover",
        heading: "Handover & enablement",
        body: [
          "Knowledge transfer is part of delivery, not a closing phase. Documentation, runbooks, and pairing time are tracked in the backlog.",
        ],
      },
    ],
  },
  {
    slug: "quality-assurance",
    path: "/technologies/company/quality-assurance",
    group: "Process",
    eyebrow: "Quality",
    title: "Quality assurance",
    metaTitle: "Quality assurance — HIGAET Technologies",
    metaDescription:
      "HIGAET Technologies treats quality as a property of the pipeline. Automated tests, code review, accessibility, performance, and observability baked in.",
    intro: "Quality is engineered, not inspected.",
    summary:
      "We treat quality as a property of the pipeline. Defects caught after release indicate a process issue, not just a code issue.",
    sections: [
      {
        id: "test-strategy",
        heading: "Test strategy",
        body: [
          "Unit, contract, integration, and end-to-end layers, weighted by risk. Performance and accessibility tests are first-class, not optional.",
        ],
        bullets: [
          "Unit + contract tests as a release gate",
          "Cross-browser and accessibility checks in CI",
          "Performance budgets enforced at build time",
          "Production monitoring with SLOs and error budgets",
        ],
      },
      {
        id: "review",
        heading: "Review and pairing",
        body: [
          "Code review is mandatory and non-ceremonial. Pairing is encouraged on hard or sensitive changes. We do not merge in silence.",
        ],
      },
    ],
  },
  {
    slug: "security",
    path: "/technologies/company/security",
    group: "Process",
    eyebrow: "Security",
    title: "Security",
    metaTitle: "Security — HIGAET Technologies",
    metaDescription:
      "How HIGAET Technologies engineers, operates, and proves security: secure SDLC, supply-chain controls, identity, and incident readiness.",
    intro: "Security as a continuous practice, not a checkbox.",
    summary:
      "We engineer security into the SDLC, prove it through evidence, and operate it through clear ownership. The summary below is what we offer clients and what we apply to ourselves.",
    sections: [
      {
        id: "secure-sdlc",
        heading: "Secure SDLC",
        body: [
          "Threat modelling on new services, secure-by-default scaffolds, automated dependency and secret scanning, signed builds, and provenance-attested deployments.",
        ],
      },
      {
        id: "operations",
        heading: "Security operations",
        body: [
          "Identity federation, least-privilege access reviews, centralised logging with tamper-evident storage, and named on-call owners for every production system.",
        ],
      },
      {
        id: "incident",
        heading: "Incident readiness",
        body: [
          "Runbooks for the incidents we have actually seen. Quarterly tabletop exercises. Post-incident reviews that focus on systemic fixes, not individual blame.",
        ],
      },
    ],
  },
  {
    slug: "delivery-process",
    path: "/technologies/company/delivery-process",
    group: "Process",
    eyebrow: "Delivery",
    title: "Delivery process",
    metaTitle: "Delivery process — HIGAET Technologies",
    metaDescription:
      "From first contact to long-term partnership: how HIGAET Technologies sequences discovery, build, release, and ongoing operation.",
    intro: "How an engagement actually runs, from first contact to long-term partnership.",
    summary:
      "Most consultancies describe a generic delivery process. Ours describes how we actually run engagements, including the un-glamorous parts.",
    sections: [
      {
        id: "intake",
        heading: "Intake & shaping",
        body: [
          "We start with two short conversations: one to understand the business problem and constraints, one to walk the current system. We come back with an engagement shape, not a sales deck.",
        ],
      },
      {
        id: "discovery",
        heading: "Discovery (1–3 weeks)",
        body: [
          "A small senior team co-locates with the client (in person or virtually), produces a target architecture, a risk log, and a sequenced backlog. Deliverable is decision-grade documentation, not slides.",
        ],
      },
      {
        id: "build",
        heading: "Build & release",
        body: [
          "Two-week iterations against a public backlog. CI/CD, automated tests, and observability from week one. Releases happen continuously; demos exist to confirm value, not to gate it.",
        ],
      },
      {
        id: "operate",
        heading: "Operate & evolve",
        body: [
          "We hand over operations to the client team with named owners and runbooks. Many clients keep HIGAET squads on as a long-term partner; some take full ownership. Both are valid endings.",
        ],
      },
    ],
  },
];

export const COMPANY_PAGES_BY_SLUG: Record<string, CompanyContent> = Object.fromEntries(
  COMPANY_PAGES.map((p) => [p.slug, p]),
);

export function getCompanyPage(slug: string): CompanyContent | undefined {
  return COMPANY_PAGES_BY_SLUG[slug];
}
