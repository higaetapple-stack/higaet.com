/**
 * HIGAET site-wide constants.
 * Keep the canonical site URL empty until a project domain or custom domain
 * is connected. Relative paths in canonical/og:url resolve correctly on any host.
 */
export const SITE = {
  name: "HIGAET",
  longName: "Helen Institute of Gen AI Engineering & Technology",
  tagline: "Advancing human capability with Gen AI",
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

const abs = (p: string) => `${SITE.url}${p.startsWith("/") ? p : `/${p}`}`;

/** Official HIGAET social / external profiles for entity grounding. */
export const SITE_SAME_AS = [
  "https://www.linkedin.com/company/higaet",
  "https://twitter.com/higaet",
  "https://www.youtube.com/@higaet",
] as const;

/** Organization JSON-LD used in the root head. All URLs absolute (AI/LLM grounding). */
export const ORG_JSONLD = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  "@id": `${SITE.url}/#organization`,
  name: SITE.longName,
  alternateName: "HIGAET",
  description: SITE.description,
  url: abs("/"),
  logo: {
    "@type": "ImageObject",
    "@id": `${SITE.url}/#logo`,
    url: abs("/og-higaet.png"),
    contentUrl: abs("/og-higaet.png"),
  },
  sameAs: [...SITE_SAME_AS],
  department: [
    { "@type": "EducationalOrganization", name: DIVISIONS.academy.name, url: abs(DIVISIONS.academy.slug) },
    { "@type": "Organization", name: DIVISIONS.global.name, url: abs(DIVISIONS.global.slug) },
    { "@type": "Organization", name: DIVISIONS.tech.name, url: abs(DIVISIONS.tech.slug) },
  ],
} as const;

export const WEBSITE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE.url}/#website`,
  name: SITE.name,
  url: abs("/"),
  publisher: { "@id": `${SITE.url}/#organization` },
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: abs("/blog?q={search_term_string}") },
    "query-input": "required name=search_term_string",
  },
} as const;

/** Path prefixes that must never appear in search results or carry a canonical. */
export const PRIVATE_PATH_PREFIXES = [
  "/dashboard",
  "/admin",
  "/crm",
  "/auth",
  "/ops",
  "/assistant",
  "/community",
  "/account",
  "/settings",
  "/_authenticated",
  // Internal-only operator / verification surfaces
  "/kernel",
  "/replay",
  "/simulate",
  "/system-dashboard",
  "/verify",
  "/verify-certificate",
] as const;

export function isPrivatePath(pathname: string): boolean {
  return PRIVATE_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function canonicalUrl(pathname: string): string {
  // Strip query/hash; collapse trailing slash (except root)
  const path = pathname.split(/[?#]/)[0] || "/";
  const clean = path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
  return `${SITE.url}${clean}`;
}
