import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import {
  academyCategoryUrl,
  getAcademyCategories,
} from "@/content/providers";
import { PROGRAMS, CAMPUSES } from "@/lib/academy-programs";
import { getCurrentHost, resolveTenantShell } from "@/lib/tenant-shell";

/**
 * Default base URL when no Host header is present (build-time / scripts).
 * At request time the sitemap is host-aware (Phase 10A · item 3): each
 * tenant shell only advertises the paths it actually serves.
 */
const DEFAULT_BASE_URL = "https://higaet.com";

interface SitemapEntry {
  path: string;
  changefreq?: "weekly" | "monthly" | "yearly";
  priority?: string;
}

const STATIC_ENTRIES: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/about", changefreq: "monthly", priority: "0.7" },
  { path: "/about-higaet", changefreq: "monthly", priority: "0.8" },
  { path: "/higaet-academy", changefreq: "monthly", priority: "0.8" },
  { path: "/higaet-global-education-hub", changefreq: "monthly", priority: "0.8" },
  { path: "/higaet-technologies", changefreq: "monthly", priority: "0.8" },
  { path: "/higaet-ai-platform", changefreq: "monthly", priority: "0.8" },
  { path: "/auth", changefreq: "monthly", priority: "0.3" },
  { path: "/careers", changefreq: "weekly", priority: "0.6" },
  { path: "/blog", changefreq: "weekly", priority: "0.8" },
  { path: "/contact", changefreq: "monthly", priority: "0.6" },
  { path: "/success-stories", changefreq: "monthly", priority: "0.6" },
  // Academy — pillar category entries are sourced dynamically (Step 7)
  // from getAcademyCategories() via the URL resolver (ADR-0003).
  // Marketing-only sub-pages (no registry contract) stay inline:
  { path: "/academy", changefreq: "weekly", priority: "0.9" },
  { path: "/academy/programs", changefreq: "weekly", priority: "0.9" },
  { path: "/academy/online-courses", changefreq: "weekly", priority: "0.8" },
  { path: "/academy/certifications", changefreq: "weekly", priority: "0.8" },
  { path: "/academy/learning-paths", changefreq: "weekly", priority: "0.8" },
  { path: "/academy/campuses", changefreq: "monthly", priority: "0.8" },
  { path: "/academy/corporate-training", changefreq: "monthly", priority: "0.7" },
  { path: "/academy/offline-training", changefreq: "monthly", priority: "0.7" },
  { path: "/academy/admissions", changefreq: "monthly", priority: "0.7" },
  { path: "/academy/scholarship", changefreq: "monthly", priority: "0.7" },
  { path: "/academy/placements", changefreq: "monthly", priority: "0.7" },
  { path: "/academy/internships", changefreq: "monthly", priority: "0.7" },
  { path: "/academy/success-stories", changefreq: "monthly", priority: "0.6" },
  { path: "/academy/blog/certifications-comparison", changefreq: "monthly", priority: "0.6" },
  { path: "/academy/faq", changefreq: "monthly", priority: "0.5" },
  { path: "/academy/contact", changefreq: "monthly", priority: "0.6" },
  // Global Education
  { path: "/global-education", changefreq: "weekly", priority: "0.9" },
  { path: "/global-education/study-abroad", changefreq: "weekly", priority: "0.8" },
  { path: "/global-education/universities", changefreq: "weekly", priority: "0.7" },
  { path: "/global-education/scholarships", changefreq: "monthly", priority: "0.7" },
  { path: "/global-education/countries", changefreq: "monthly", priority: "0.7" },
  { path: "/global-education/visa-guidance", changefreq: "monthly", priority: "0.7" },
  { path: "/global-education/student-services", changefreq: "monthly", priority: "0.6" },
  { path: "/global-education/admission-process", changefreq: "monthly", priority: "0.7" },
  { path: "/global-education/faq", changefreq: "monthly", priority: "0.5" },
  { path: "/global-education/contact", changefreq: "monthly", priority: "0.6" },
  // Technologies
  { path: "/technologies", changefreq: "weekly", priority: "0.9" },
  { path: "/technologies/custom-software-development", changefreq: "monthly", priority: "0.8" },
  { path: "/technologies/enterprise-software", changefreq: "monthly", priority: "0.8" },
  { path: "/technologies/web-development", changefreq: "monthly", priority: "0.8" },
  { path: "/technologies/mobile-development", changefreq: "monthly", priority: "0.8" },
  { path: "/technologies/ai-solutions", changefreq: "monthly", priority: "0.8" },
  { path: "/technologies/saas-products", changefreq: "monthly", priority: "0.7" },
  { path: "/technologies/cloud-solutions", changefreq: "monthly", priority: "0.8" },
  { path: "/technologies/cloud-migration", changefreq: "monthly", priority: "0.8" },
  { path: "/technologies/devops", changefreq: "monthly", priority: "0.7" },
  { path: "/technologies/qa-testing", changefreq: "monthly", priority: "0.7" },
  { path: "/technologies/data-engineering", changefreq: "monthly", priority: "0.7" },
  { path: "/technologies/business-intelligence", changefreq: "monthly", priority: "0.7" },
  { path: "/technologies/api-development", changefreq: "monthly", priority: "0.7" },
  { path: "/technologies/system-integration", changefreq: "monthly", priority: "0.7" },
  { path: "/technologies/legacy-modernization", changefreq: "monthly", priority: "0.7" },
  { path: "/technologies/software-maintenance", changefreq: "monthly", priority: "0.7" },
  { path: "/technologies/it-consulting", changefreq: "monthly", priority: "0.7" },
  { path: "/technologies/staff-augmentation", changefreq: "monthly", priority: "0.7" },
  { path: "/technologies/dedicated-team", changefreq: "monthly", priority: "0.7" },
  { path: "/technologies/ui-ux-design", changefreq: "monthly", priority: "0.7" },
  { path: "/technologies/digital-transformation", changefreq: "monthly", priority: "0.7" },
  { path: "/technologies/software-development", changefreq: "monthly", priority: "0.6" },
  { path: "/technologies/digital-marketing", changefreq: "monthly", priority: "0.6" },
  { path: "/technologies/product-development", changefreq: "monthly", priority: "0.7" },
  { path: "/technologies/case-studies", changefreq: "weekly", priority: "0.8" },
  ...[
    "global-fintech-payments-modernization",
    "healthcare-ai-clinical-copilot",
    "retail-omnichannel-saas-platform",
    "edtech-learning-platform-scale",
    "logistics-iot-realtime-tracking",
    "manufacturing-smart-factory-ai-quality",
  ].map((slug) => ({ path: `/technologies/case-studies/${slug}`, changefreq: "monthly" as const, priority: "0.7" })),
  { path: "/technologies/industries", changefreq: "monthly", priority: "0.7" },
  { path: "/technologies/industries/education", changefreq: "monthly", priority: "0.7" },
  { path: "/technologies/industries/healthcare", changefreq: "monthly", priority: "0.7" },
  { path: "/technologies/industries/finance", changefreq: "monthly", priority: "0.7" },
  { path: "/technologies/industries/banking", changefreq: "monthly", priority: "0.7" },
  { path: "/technologies/industries/fintech", changefreq: "monthly", priority: "0.7" },
  { path: "/technologies/industries/retail", changefreq: "monthly", priority: "0.7" },
  { path: "/technologies/industries/ecommerce", changefreq: "monthly", priority: "0.7" },
  { path: "/technologies/industries/manufacturing", changefreq: "monthly", priority: "0.7" },
  { path: "/technologies/industries/logistics", changefreq: "monthly", priority: "0.7" },
  { path: "/technologies/industries/real-estate", changefreq: "monthly", priority: "0.7" },
  { path: "/technologies/industries/hospitality", changefreq: "monthly", priority: "0.7" },
  { path: "/technologies/industries/government", changefreq: "monthly", priority: "0.7" },
  { path: "/technologies/industries/startups", changefreq: "monthly", priority: "0.7" },
  { path: "/technologies/industries/sme", changefreq: "monthly", priority: "0.7" },
  { path: "/technologies/industries/enterprise", changefreq: "monthly", priority: "0.7" },
  // Technology Expertise
  { path: "/technologies/expertise", changefreq: "monthly", priority: "0.8" },
  ...[
    "react","nextjs","angular","vuejs","html5","css3","javascript","typescript",
    "nodejs","express","python","java","spring-boot","dotnet","php","laravel","go",
    "react-native","flutter","android","ios",
    "mysql","postgresql","mongodb","redis",
    "aws","azure","gcp","docker","kubernetes",
    "openai","generative-ai","machine-learning","nlp","computer-vision","ai-automation",
    "data-engineering-tech","business-intelligence-tech",
  ].map((slug) => ({ path: `/technologies/expertise/${slug}`, changefreq: "monthly" as const, priority: "0.6" })),
  // Engagement Models
  { path: "/technologies/engagement", changefreq: "monthly", priority: "0.8" },
  ...[
    "dedicated-development-team",
    "staff-augmentation",
    "fixed-price-projects",
    "time-and-materials",
    "offshore-development-center",
    "build-operate-transfer",
  ].map((slug) => ({ path: `/technologies/engagement/${slug}`, changefreq: "monthly" as const, priority: "0.7" })),
  { path: "/technologies/careers", changefreq: "weekly", priority: "0.6" },
  { path: "/technologies/contact", changefreq: "monthly", priority: "0.6" },
  // Insights / Knowledge Center
  { path: "/technologies/insights", changefreq: "weekly", priority: "0.8" },
  ...[
    "engineering-production-rag-systems",
    "cloud-cost-discipline-without-slowing-engineering",
    "secure-software-delivery-in-regulated-environments",
    "modernising-legacy-monoliths-without-a-rewrite",
    "data-platforms-that-survive-reorgs",
    "designing-enterprise-saas-for-multi-tenant-reality",
  ].map((slug) => ({ path: `/technologies/insights/${slug}`, changefreq: "monthly" as const, priority: "0.7" })),
  // Company
  { path: "/technologies/company", changefreq: "monthly", priority: "0.7" },
  ...[
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
  ].map((slug) => ({ path: `/technologies/company/${slug}`, changefreq: "monthly" as const, priority: "0.6" })),
  // Legal
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
  { path: "/cookies", changefreq: "yearly", priority: "0.3" },
];

// Blog posts and job listings are currently authored in code. When they move to
// Lovable Cloud, replace these with a server fetch.
const BLOG_SLUGS = [
  "the-state-of-ai-engineering-education",
  "study-abroad-checklist-fall-2026",
  "rag-vs-fine-tuning-2026",
];
const JOB_SLUGS = [
  "senior-ai-engineer",
  "curriculum-lead-genai",
  "admissions-counsellor-uk",
  "fullstack-engineer",
  "growth-marketing-manager",
  "visa-advisor-canada",
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const host = getCurrentHost(request.headers.get("host"));
        const shell = resolveTenantShell(host);
        const baseUrl = host ? `https://${host}` : DEFAULT_BASE_URL;

        // Academy pillar URLs — registry-backed, resolved through the
        // route-aware URL resolver so live routes are the source of truth.
        const academyCategories = await getAcademyCategories({
          filter: { visibility: "public" },
        });
        const academyCategoryEntries: SitemapEntry[] = academyCategories.map(
          (c) => ({
            path: academyCategoryUrl(c.slug),
            changefreq: "weekly" as const,
            priority: "0.8",
          }),
        );

        // Academy programs & campuses — single source of truth (academy-programs.ts).
        const programEntries: SitemapEntry[] = PROGRAMS.map((p) => ({
          path: `/academy/programs/${p.slug}`,
          changefreq: "monthly" as const,
          priority: "0.7",
        }));
        const campusEntries: SitemapEntry[] = CAMPUSES.map((c) => ({
          path: `/academy/campuses/${c.slug}`,
          changefreq: "monthly" as const,
          priority: "0.7",
        }));

        const allEntries: SitemapEntry[] = [
          ...STATIC_ENTRIES,
          ...academyCategoryEntries,
          ...programEntries,
          ...campusEntries,
          ...BLOG_SLUGS.map((slug) => ({ path: `/blog/${slug}`, changefreq: "monthly" as const, priority: "0.6" })),
          ...JOB_SLUGS.map((slug) => ({ path: `/careers/${slug}`, changefreq: "weekly" as const, priority: "0.5" })),
        ];

        // Per-host filtering (Phase 10A · item 3). Corporate / preview / apex
        // see everything; subdomain shells only advertise their own prefixes.
        const entries =
          shell.id === "corporate"
            ? allEntries
            : allEntries.filter((e) =>
                shell.allowedPrefixes.some(
                  (p) => p !== "/" && (e.path === p || e.path.startsWith(p + "/")),
                ),
              );

        const urls = entries
          .map((e) =>
            [
              `  <url>`,
              `    <loc>${baseUrl}${e.path}</loc>`,
              e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
              e.priority ? `    <priority>${e.priority}</priority>` : null,
              `  </url>`,
            ]
              .filter(Boolean)
              .join("\n"),
          )
          .join("\n");

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
