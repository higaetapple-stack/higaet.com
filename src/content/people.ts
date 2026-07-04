/**
 * HIGAET people registry — used by /founder, /leadership, /faculty, /advisors,
 * /partners pages to generate Person / ProfilePage JSON-LD and human content.
 *
 * Bios are intentionally generic where specifics aren't public. Update titles,
 * affiliations, and sameAs links with verified facts before publication.
 */
export type Person = {
  slug: string;
  name: string;
  jobTitle: string;
  affiliation: "HIGAET" | "HIGAET Academy" | "HIGAET Global Education Hub" | "HIGAET Technologies" | "HIGAET AI Platform";
  bio: string;
  sameAs?: string[];
};

export const FOUNDER: Person = {
  slug: "founder",
  name: "Helen Founder",
  jobTitle: "Founder & Chief Executive",
  affiliation: "HIGAET",
  bio: "Founder of the Helen Institute of Gen AI Engineering & Technology (HIGAET). Leads the institute's mission across AI education, global university pathways, and enterprise AI engineering.",
};

export const LEADERSHIP: Person[] = [
  { slug: "ceo", name: "Helen Founder", jobTitle: "Founder & CEO", affiliation: "HIGAET", bio: "Sets institute-wide strategy across HIGAET Academy, Global Education Hub, and Technologies." },
  { slug: "dean-academy", name: "Dean, HIGAET Academy", jobTitle: "Dean", affiliation: "HIGAET Academy", bio: "Leads curriculum, faculty, and program outcomes for AI engineering education." },
  { slug: "head-global", name: "Head, Global Education Hub", jobTitle: "Head of Global Education", affiliation: "HIGAET Global Education Hub", bio: "Leads international admissions, counselling, visa guidance, and university partnerships." },
  { slug: "cto-tech", name: "CTO, HIGAET Technologies", jobTitle: "Chief Technology Officer", affiliation: "HIGAET Technologies", bio: "Leads enterprise AI delivery, platform engineering, and customer architecture." },
  { slug: "head-ai-platform", name: "Head, HIGAET AI Platform", jobTitle: "Head of AI Platform", affiliation: "HIGAET AI Platform", bio: "Leads RAG, agentic AI, multi-model orchestration, and observability for the platform." },
];

export const FACULTY: Person[] = [
  { slug: "faculty-gen-ai", name: "Lead Faculty — Generative AI", jobTitle: "Lead Faculty, Generative AI", affiliation: "HIGAET Academy", bio: "Teaches the Generative AI Engineering track with practitioner case studies." },
  { slug: "faculty-rag", name: "Lead Faculty — RAG Engineering", jobTitle: "Lead Faculty, RAG Engineering", affiliation: "HIGAET Academy", bio: "Owns the RAG curriculum, evaluation harness, and capstone reviews." },
  { slug: "faculty-agentic", name: "Lead Faculty — Agentic AI", jobTitle: "Lead Faculty, Agentic AI", affiliation: "HIGAET Academy", bio: "Designs the agentic AI program covering tool use, planning, and safety." },
  { slug: "faculty-data", name: "Lead Faculty — Data Science", jobTitle: "Lead Faculty, Data Science", affiliation: "HIGAET Academy", bio: "Teaches applied data science, ML engineering, and analytics tracks." },
];

export const ADVISORS: Person[] = [
  { slug: "advisor-academic", name: "Academic Advisor", jobTitle: "Academic Advisor", affiliation: "HIGAET", bio: "Advises on curriculum standards and learner outcomes." },
  { slug: "advisor-industry", name: "Industry Advisor", jobTitle: "Industry Advisor", affiliation: "HIGAET", bio: "Advises on enterprise AI adoption patterns and hiring outcomes." },
  { slug: "advisor-global", name: "Global Education Advisor", jobTitle: "Global Education Advisor", affiliation: "HIGAET Global Education Hub", bio: "Advises on destination strategy, university partnerships, and admissions." },
];

export const PARTNERS = [
  { slug: "partner-universities", name: "University Partners", description: "Partner universities across the USA, UK, Canada, Australia, and Europe accepting HIGAET-counselled applicants." },
  { slug: "partner-enterprises", name: "Enterprise Partners", description: "Companies that hire HIGAET Academy graduates and engage HIGAET Technologies for AI delivery." },
  { slug: "partner-cloud", name: "Cloud & AI Partners", description: "Cloud and model-provider ecosystems integrated through the HIGAET AI Platform." },
];

const BASE = "https://www.higaet.com";

const ORG_REF = {
  HIGAET: { "@id": `${BASE}/about-higaet#org` },
  "HIGAET Academy": { "@id": `${BASE}/higaet-academy#org` },
  "HIGAET Global Education Hub": { "@id": `${BASE}/higaet-global-education-hub#org` },
  "HIGAET Technologies": { "@id": `${BASE}/higaet-technologies#org` },
  "HIGAET AI Platform": { "@id": `${BASE}/higaet-ai-platform#org` },
} as const;

export function personJsonLd(p: Person, profilePath: string) {
  return {
    "@type": "Person",
    "@id": `${BASE}${profilePath}#${p.slug}`,
    name: p.name,
    jobTitle: p.jobTitle,
    description: p.bio,
    worksFor: {
      "@type": "Organization",
      name: p.affiliation,
      ...ORG_REF[p.affiliation],
    },
    ...(p.sameAs ? { sameAs: p.sameAs } : {}),
  };
}

export function profilePageJsonLd(opts: {
  path: string;
  name: string;
  description: string;
  people: Person[];
  breadcrumbs: { name: string; url: string }[];
}) {
  const url = `${BASE}${opts.path}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        "@id": `${url}#page`,
        url,
        name: opts.name,
        description: opts.description,
        about: opts.people.map((p) => ({ "@id": `${url}#${p.slug}` })),
        breadcrumb: { "@id": `${url}#breadcrumb` },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: opts.breadcrumbs.map((b, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: b.name,
          item: b.url.startsWith("http") ? b.url : `${BASE}${b.url}`,
        })),
      },
      ...opts.people.map((p) => personJsonLd(p, opts.path)),
    ],
  };
}
