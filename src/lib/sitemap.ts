/**
 * Canonical sitemap dataset + XML builders for HIGAET production.
 *
 * Single source of truth for ALL sitemap routes (/sitemap.xml index +
 * /sitemaps/*.xml children). Every URL listed here was verified live
 * (HTTP 200, self-referencing www canonical, indexable, JSON-LD present).
 *
 * Rules:
 * - Canonical base is ALWAYS https://www.higaet.com (never apex, never http).
 * - No changefreq / priority (modern best practice).
 * - lastmod ONLY from content-authored dates (docs `updated`); omitted elsewhere.
 * - Never include auth, dashboard, admin, API, utility, parameter, or
 *   unverified dynamic URLs. See route audit 2026-09-06.
 */
import { PROGRAMS, CAMPUSES } from "@/lib/academy-programs";
import { DOC_CATEGORIES } from "@/content/docs";
import { UNIVERSITIES_KB } from "@/content/universities-kb";
import { COUNTRIES } from "@/lib/countries-data";
import { getAcademyCategories } from "@/content/providers/academy";
import { academyCategoryUrl } from "@/content/providers/academy-urls";

export const SITEMAP_BASE = "https://www.higaet.com" as const;

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
}

function abs(path: string): string {
  return `${SITEMAP_BASE}${path}`;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Blog slugs are authored inline in src/routes/blog.$slug.tsx (POSTS). */
const BLOG_SLUGS = [
  "the-state-of-ai-engineering-education",
  "study-abroad-checklist-fall-2026",
  "rag-vs-fine-tuning-2026",
] as const;

/** Career slugs are authored inline in src/routes/careers.$slug.tsx (JOBS). */
const CAREER_SLUGS = [
  "senior-ai-engineer",
  "curriculum-lead-genai",
  "admissions-counsellor-uk",
  "fullstack-engineer",
  "growth-marketing-manager",
  "visa-advisor-canada",
] as const;

const INSIGHT_SLUGS = [
  "engineering-production-rag-systems",
  "cloud-cost-discipline-without-slowing-engineering",
  "secure-software-delivery-in-regulated-environments",
  "modernising-legacy-monoliths-without-a-rewrite",
  "data-platforms-that-survive-reorgs",
  "designing-enterprise-saas-for-multi-tenant-reality",
] as const;

const CASE_SLUGS = [
  "global-fintech-payments-modernization",
  "healthcare-ai-clinical-copilot",
  "retail-omnichannel-saas-platform",
  "edtech-learning-platform-scale",
  "logistics-iot-realtime-tracking",
  "manufacturing-smart-factory-ai-quality",
] as const;

const COMPANY_SLUGS = [
  "about",
  "leadership",
  "mission",
  "vision",
  "values",
  "culture",
  "why-higaet-technologies",
  "development-methodology",
  "quality-assurance",
  "security",
  "delivery-process",
] as const;

const TECH_SERVICES = [
  "custom-software-development",
  "enterprise-software",
  "web-development",
  "mobile-development",
  "ai-solutions",
  "saas-products",
  "cloud-solutions",
  "cloud-migration",
  "devops",
  "qa-testing",
  "data-engineering",
  "business-intelligence",
  "api-development",
  "system-integration",
  "legacy-modernization",
  "software-maintenance",
  "it-consulting",
  "staff-augmentation",
  "dedicated-team",
  "ui-ux-design",
  "digital-transformation",
  "software-development",
  "digital-marketing",
  "product-development",
] as const;

const TECH_INDUSTRIES = [
  "education",
  "healthcare",
  "finance",
  "banking",
  "fintech",
  "retail",
  "ecommerce",
  "manufacturing",
  "logistics",
  "real-estate",
  "hospitality",
  "government",
  "startups",
  "sme",
  "enterprise",
] as const;

const TECH_EXPERTISE = [
  "react",
  "nextjs",
  "angular",
  "vuejs",
  "html5",
  "css3",
  "javascript",
  "typescript",
  "nodejs",
  "express",
  "python",
  "java",
  "spring-boot",
  "dotnet",
  "php",
  "laravel",
  "go",
  "react-native",
  "flutter",
  "android",
  "ios",
  "mysql",
  "postgresql",
  "mongodb",
  "redis",
  "aws",
  "azure",
  "gcp",
  "docker",
  "kubernetes",
  "openai",
  "generative-ai",
  "machine-learning",
  "nlp",
  "computer-vision",
  "ai-automation",
  "data-engineering-tech",
  "business-intelligence-tech",
] as const;

const TECH_ENGAGEMENT = [
  "dedicated-development-team",
  "staff-augmentation",
  "fixed-price-projects",
  "time-and-materials",
  "offshore-development-center",
  "build-operate-transfer",
] as const;

const ACADEMY_PAGES = [
  "/academy",
  "/academy/programs",
  "/academy/online-courses",
  "/academy/certifications",
  "/academy/learning-paths",
  "/academy/campuses",
  "/academy/corporate-training",
  "/academy/offline-training",
  "/academy/admissions",
  "/academy/scholarship",
  "/academy/placements",
  "/academy/internships",
  "/academy/success-stories",
  "/academy/blog/certifications-comparison",
  "/academy/faq",
  "/academy/contact",
] as const;

const GLOBAL_PAGES = [
  "/global-education",
  "/global-education/study-abroad",
  "/global-education/universities",
  "/global-education/knowledge-base/universities",
  "/global-education/scholarships",
  "/global-education/countries",
  "/global-education/visa-guidance",
  "/global-education/student-services",
  "/global-education/admission-process",
  "/global-education/faq",
  "/global-education/contact",
] as const;

const ROOT_PAGES = [
  "/",
  "/about",
  "/about-higaet",
  "/higaet-academy",
  "/higaet-global-education-hub",
  "/higaet-technologies",
  "/higaet-ai-platform",
  "/founder",
  "/leadership",
  "/faculty",
  "/advisors",
  "/partners",
  "/contact",
  "/jobs",
  "/success-stories",
  "/privacy",
  "/terms",
  "/cookies",
] as const;

export interface SitemapSegment {
  name: string;
  file: string;
  urls: SitemapUrl[];
}

function paths(list: readonly string[]): SitemapUrl[] {
  return list.map((p) => ({ loc: abs(p) }));
}

async function academySegment(): Promise<SitemapUrl[]> {
  const urls: SitemapUrl[] = [...paths(ACADEMY_PAGES)];
  // Registry-backed public categories that resolve to live routes only.
  // (Generated course / learning-path detail URLs 404 — excluded by audit.)
  const cats = await getAcademyCategories({ filter: { visibility: "public" } });
  const seen = new Set(urls.map((u) => u.loc));
  for (const c of cats) {
    const loc = abs(academyCategoryUrl(c));
    if (!seen.has(loc)) {
      // Only emit category URLs that map to verified live landing pages.
      // Overrides (/academy/corporate-training, /academy/offline-training)
      // are already in ACADEMY_PAGES; direct /academy/<slug> pages 404
      // unless present in ACADEMY_PAGES, so skip anything else.
      if ((ACADEMY_PAGES as readonly string[]).includes(loc.replace(SITEMAP_BASE, ""))) {
        urls.push({ loc });
        seen.add(loc);
      }
    }
  }
  for (const p of PROGRAMS) {
    const loc = abs(`/academy/programs/${p.slug}`);
    if (!seen.has(loc)) {
      urls.push({ loc });
      seen.add(loc);
    }
  }
  for (const c of CAMPUSES) {
    const loc = abs(`/academy/campuses/${c.slug}`);
    if (!seen.has(loc)) {
      urls.push({ loc });
      seen.add(loc);
    }
  }
  return urls.sort((a, b) => (a.loc < b.loc ? -1 : 1));
}

function docsSegment(): SitemapUrl[] {
  const urls: SitemapUrl[] = [
    { loc: abs("/docs/api-reference") },
    { loc: abs("/docs/authentication") },
    { loc: abs("/docs/webhooks") },
  ];
  for (const cat of DOC_CATEGORIES) {
    urls.push({ loc: abs(`/docs/${cat.slug}`) });
    for (const a of cat.articles) {
      urls.push({ loc: abs(`/docs/${cat.slug}/${a.slug}`), lastmod: a.updated });
    }
  }
  return urls.sort((a, b) => (a.loc < b.loc ? -1 : 1));
}

export async function getSitemapSegments(): Promise<SitemapSegment[]> {
  return [
    { name: "pages", file: "sitemap-pages.xml", urls: paths(ROOT_PAGES) },
    { name: "academy", file: "sitemap-academy.xml", urls: await academySegment() },
    {
      name: "global-education",
      file: "sitemap-global-education.xml",
      urls: [
        ...paths(GLOBAL_PAGES),
        ...Object.keys(COUNTRIES).map((k) => ({ loc: abs(`/global-education/countries/${k}`) })),
        ...UNIVERSITIES_KB.map((u) => ({
          loc: abs(`/global-education/knowledge-base/universities/${u.slug}`),
        })),
      ].sort((a, b) => (a.loc < b.loc ? -1 : 1)),
    },
    {
      name: "technologies",
      file: "sitemap-technologies.xml",
      urls: [
        { loc: abs("/technologies") },
        ...paths(TECH_SERVICES.map((s) => `/technologies/${s}`)),
        { loc: abs("/technologies/case-studies") },
        ...CASE_SLUGS.map((s) => ({ loc: abs(`/technologies/case-studies/${s}`) })),
        { loc: abs("/technologies/industries") },
        ...TECH_INDUSTRIES.map((s) => ({ loc: abs(`/technologies/industries/${s}`) })),
        { loc: abs("/technologies/expertise") },
        ...TECH_EXPERTISE.map((s) => ({ loc: abs(`/technologies/expertise/${s}`) })),
        { loc: abs("/technologies/engagement") },
        ...TECH_ENGAGEMENT.map((s) => ({ loc: abs(`/technologies/engagement/${s}`) })),
        { loc: abs("/technologies/careers") },
        { loc: abs("/technologies/contact") },
        { loc: abs("/technologies/insights") },
        ...INSIGHT_SLUGS.map((s) => ({ loc: abs(`/technologies/insights/${s}`) })),
        { loc: abs("/technologies/company") },
        ...COMPANY_SLUGS.map((s) => ({ loc: abs(`/technologies/company/${s}`) })),
      ].sort((a, b) => (a.loc < b.loc ? -1 : 1)),
    },
    {
      name: "blog",
      file: "sitemap-blog.xml",
      urls: [{ loc: abs("/blog") }, ...BLOG_SLUGS.map((s) => ({ loc: abs(`/blog/${s}`) }))].sort(
        (a, b) => (a.loc < b.loc ? -1 : 1),
      ),
    },
    {
      name: "careers",
      file: "sitemap-careers.xml",
      urls: [
        { loc: abs("/careers") },
        ...CAREER_SLUGS.map((s) => ({ loc: abs(`/careers/${s}`) })),
      ].sort((a, b) => (a.loc < b.loc ? -1 : 1)),
    },
    { name: "docs", file: "sitemap-docs.xml", urls: docsSegment() },
  ];
}

export function buildUrlsetXml(urls: SitemapUrl[]): string {
  const body = urls
    .map(
      (u) =>
        `  <url>\n    <loc>${esc(u.loc)}</loc>` +
        (u.lastmod ? `\n    <lastmod>${esc(u.lastmod)}</lastmod>` : "") +
        `\n  </url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`;
}

export function buildSitemapIndexXml(files: string[]): string {
  const body = files
    .map((f) => `  <sitemap>\n    <loc>${esc(`${SITEMAP_BASE}/sitemaps/${f}`)}</loc>\n  </sitemap>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>`;
}

export function xmlResponse(xml: string): Response {
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

/* ================================================================
 * HTML sitemap (https://www.higaet.com/sitemap) — human-readable
 * sections derived from the same verified sources as the XML
 * sitemap. Labels come from content registries; titleize fallback
 * for slug-only lists. NEVER add a link here that is not a verified
 * indexable URL from getSitemapSegments().
 * ============================================================== */

export interface HtmlSitemapLink {
  loc: string;
  label: string;
}

export interface HtmlSitemapSection {
  title: string;
  blurb: string;
  links: HtmlSitemapLink[];
}

const ACRONYMS = new Set([
  "ai",
  "api",
  "saas",
  "qa",
  "ui",
  "ux",
  "iot",
  "ml",
  "nlp",
  "aws",
  "gcp",
  "seo",
  "crm",
  "lms",
  "rag",
  "llm",
  "mlops",
  "devops",
  "css",
  "html",
  "ios",
  "faq",
  "sop",
  "lor",
  "usa",
  "uk",
  "f1",
]);

function titleize(slug: string): string {
  return slug
    .split("-")
    .map((w) =>
      ACRONYMS.has(w.toLowerCase()) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1),
    )
    .join(" ");
}

/** Curated descriptive labels for key landing pages. */
const LANDING_LABELS: Record<string, string> = {
  "/": "HIGAET Home",
  "/about": "About HIGAET",
  "/about-higaet": "About the Institute",
  "/contact": "Contact HIGAET",
  "/careers": "Careers at HIGAET",
  "/blog": "HIGAET Blog",
  "/jobs": "HIGAET Job Board",
  "/success-stories": "Student Success Stories",
  "/privacy": "Privacy Policy",
  "/terms": "Terms of Service",
  "/cookies": "Cookie Policy",
  "/academy": "HIGAET Academy",
  "/academy/programs": "HIGAET Academy Programs",
  "/academy/admissions": "Academy Admissions",
  "/academy/campuses": "Academy Campuses",
  "/academy/certifications": "Academy Certifications",
  "/academy/learning-paths": "Academy Learning Paths",
  "/academy/online-courses": "Academy Online Courses",
  "/academy/corporate-training": "Corporate Training",
  "/academy/offline-training": "Offline Training",
  "/academy/scholarship": "Academy Scholarships",
  "/academy/placements": "Academy Placements",
  "/academy/internships": "Academy Internships",
  "/academy/success-stories": "Academy Success Stories",
  "/academy/faq": "Academy FAQs",
  "/academy/contact": "Academy Contact",
  "/academy/blog/certifications-comparison": "Certifications Comparison Guide",
  "/global-education": "HIGAET Global Education Hub",
  "/global-education/study-abroad": "Study Abroad Programs",
  "/global-education/universities": "Partner Universities",
  "/global-education/knowledge-base/universities": "University Knowledge Base",
  "/global-education/scholarships": "Study Abroad Scholarships",
  "/global-education/countries": "Study Destinations",
  "/global-education/visa-guidance": "Student Visa Guidance",
  "/global-education/student-services": "Student Services",
  "/global-education/admission-process": "Admission Process",
  "/global-education/faq": "Global Education FAQs",
  "/global-education/contact": "Global Education Contact",
  "/technologies": "HIGAET Technologies",
  "/technologies/case-studies": "Technology Case Studies",
  "/technologies/industries": "Industries Served",
  "/technologies/expertise": "Technology Expertise",
  "/technologies/engagement": "Engagement Models",
  "/technologies/careers": "Technology Careers",
  "/technologies/contact": "Technologies Contact",
  "/technologies/insights": "Technology Insights",
  "/technologies/company": "About HIGAET Technologies",
  "/docs/api-reference": "API Reference",
  "/docs/authentication": "Authentication Guide",
  "/docs/webhooks": "Webhooks Guide",
  "/higaet-academy": "HIGAET Academy Overview",
  "/higaet-global-education-hub": "Global Education Hub Overview",
  "/higaet-technologies": "HIGAET Technologies Overview",
  "/higaet-ai-platform": "HIGAET AI Platform",
  "/founder": "Founder",
  "/leadership": "Leadership",
  "/faculty": "Faculty",
  "/advisors": "Advisors",
  "/partners": "Partners",
};

const BLOG_TITLES: Record<string, string> = {
  "the-state-of-ai-engineering-education": "The State of AI Engineering Education",
  "study-abroad-checklist-fall-2026": "Study Abroad Checklist — Fall 2026",
  "rag-vs-fine-tuning-2026": "RAG vs Fine-Tuning in 2026",
};

const CAREER_TITLES: Record<string, string> = {
  "senior-ai-engineer": "Senior AI Engineer",
  "curriculum-lead-genai": "Curriculum Lead — Generative AI",
  "admissions-counsellor-uk": "Admissions Counsellor — UK Track",
  "fullstack-engineer": "Full-Stack Engineer",
  "growth-marketing-manager": "Growth Marketing Manager",
  "visa-advisor-canada": "Visa Advisor — Canada Track",
};

function labelFor(path: string): string {
  const hit = LANDING_LABELS[path];
  if (hit) return hit;
  const slug = path.split("/").pop() ?? path;
  return titleize(slug);
}

function link(path: string, label?: string): HtmlSitemapLink {
  return { loc: abs(path), label: label ?? labelFor(path) };
}

export async function getHtmlSitemapSections(): Promise<HtmlSitemapSection[]> {
  const programLabels = new Map(PROGRAMS.map((p) => [`/academy/programs/${p.slug}`, p.title]));
  const campusLabels = new Map(CAMPUSES.map((c) => [`/academy/campuses/${c.slug}`, c.name]));
  const countryLabels = new Map(
    Object.entries(COUNTRIES).map(([k, v]) => [
      `/global-education/countries/${k}`,
      `Study in ${v.name}`,
    ]),
  );
  const kbLabels = new Map(
    UNIVERSITIES_KB.map((u) => [`/global-education/knowledge-base/universities/${u.slug}`, u.name]),
  );
  const docLabels = new Map<string, string>();
  for (const cat of DOC_CATEGORIES) {
    docLabels.set(`/docs/${cat.slug}`, `${cat.name} — Documentation`);
    for (const a of cat.articles) {
      docLabels.set(`/docs/${cat.slug}/${a.slug}`, a.title);
    }
  }
  docLabels.set("/docs/api-reference", "API Reference");
  docLabels.set("/docs/authentication", "Authentication Guide");
  docLabels.set("/docs/webhooks", "Webhooks Guide");

  const labelMaps = [programLabels, campusLabels, countryLabels, kbLabels, docLabels];
  const labeled = (path: string): HtmlSitemapLink => {
    for (const m of labelMaps) {
      const hit = m.get(path);
      if (hit) return { loc: abs(path), label: hit };
    }
    if (path.startsWith("/blog/")) {
      const slug = path.split("/").pop() ?? "";
      return { loc: abs(path), label: BLOG_TITLES[slug] ?? titleize(slug) };
    }
    if (path.startsWith("/careers/")) {
      const slug = path.split("/").pop() ?? "";
      return { loc: abs(path), label: CAREER_TITLES[slug] ?? titleize(slug) };
    }
    return link(path);
  };

  const segs = await getSitemapSegments();
  const byName = new Map(
    segs.map((s) => [s.name, s.urls.map((u) => u.loc.replace(SITEMAP_BASE, ""))]),
  );

  const pick = (name: string): HtmlSitemapLink[] => (byName.get(name) ?? []).map(labeled);

  const inPaths = (name: string, paths: string[]): HtmlSitemapLink[] =>
    pick(name).filter((l) => paths.includes(l.loc.replace(SITEMAP_BASE, "")));

  const notInPaths = (name: string, paths: string[]): HtmlSitemapLink[] =>
    pick(name).filter((l) => !paths.includes(l.loc.replace(SITEMAP_BASE, "")));

  const institutePaths = [
    "/",
    "/about",
    "/about-higaet",
    "/higaet-academy",
    "/higaet-global-education-hub",
    "/higaet-technologies",
    "/higaet-ai-platform",
    "/founder",
    "/leadership",
    "/faculty",
    "/advisors",
    "/partners",
    "/contact",
    "/success-stories",
    "/privacy",
    "/terms",
    "/cookies",
  ];

  return [
    {
      title: "HIGAET Institute",
      blurb: "Home, about, contact, company, and legal pages.",
      links: inPaths("pages", institutePaths),
    },
    {
      title: "HIGAET Academy",
      blurb: "Programs, admissions, campuses, certifications, and learning resources.",
      links: pick("academy"),
    },
    {
      title: "Global Education Hub",
      blurb: "Study-abroad programs, destinations, universities, visas, and scholarships.",
      links: pick("global-education"),
    },
    {
      title: "HIGAET Technologies",
      blurb: "Services, industries, expertise, case studies, insights, and engagement models.",
      links: pick("technologies"),
    },
    {
      title: "Blog",
      blurb: "Articles and guides from the HIGAET Journal.",
      links: pick("blog"),
    },
    {
      title: "Careers & Jobs",
      blurb: "Open roles at HIGAET and the graduate job board.",
      links: [...pick("careers"), ...inPaths("pages", ["/jobs"])],
    },
    {
      title: "Resources & Documentation",
      blurb:
        "Guides, references, and documentation for Academy, Global Education, AI Platform, and APIs.",
      links: pick("docs"),
    },
  ];
}
