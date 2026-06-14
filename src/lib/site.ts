/**
 * HIGAET site-wide constants.
 * Keep the canonical site URL empty until a project domain or custom domain
 * is connected. Relative paths in canonical/og:url resolve correctly on any host.
 */
export const SITE = {
  name: "HIGAET",
  longName: "Helen Institute of Gen AI Engineering & Technology",
  tagline: "Advancing human capability through Generative Intelligence.",
  description:
    "HIGAET is a global institute spanning AI education, international university pathways, and enterprise software engineering.",
  url: import.meta.env.VITE_SITE_URL ?? "https://higaet.com",
  twitter: "@higaet",
} as const;

export const DIVISIONS = {
  academy: {
    slug: "/academy",
    name: "HIGAET Academy",
    short: "Academy",
    blurb:
      "Professional certifications and hands-on training for the next generation of AI engineers and researchers.",
  },
  global: {
    slug: "/global-education",
    name: "HIGAET Global Education Hub",
    short: "Global Hub",
    blurb:
      "Seamless international transitions with partner universities, visa assistance, and scholarship guidance.",
  },
  tech: {
    slug: "/technologies",
    name: "HIGAET Technologies",
    short: "Technologies",
    blurb:
      "Bespoke AI solutions and software engineering for enterprises scaling their digital infrastructure.",
  },
} as const;

/** Organization JSON-LD used in the root head. */
export const ORG_JSONLD = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: SITE.longName,
  alternateName: "HIGAET",
  description: SITE.description,
  url: "/",
  department: [
    { "@type": "EducationalOrganization", name: DIVISIONS.academy.name, url: DIVISIONS.academy.slug },
    { "@type": "Organization", name: DIVISIONS.global.name, url: DIVISIONS.global.slug },
    { "@type": "Organization", name: DIVISIONS.tech.name, url: DIVISIONS.tech.slug },
  ],
} as const;

export const WEBSITE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE.name,
  url: "/",
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: "/blog?q={search_term_string}" },
    "query-input": "required name=search_term_string",
  },
} as const;
