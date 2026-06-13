import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

// TODO: replace with the production project URL once a custom domain is connected.
const BASE_URL = "";

interface SitemapEntry {
  path: string;
  changefreq?: "weekly" | "monthly" | "yearly";
  priority?: string;
}

const STATIC_ENTRIES: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/about", changefreq: "monthly", priority: "0.7" },
  { path: "/careers", changefreq: "weekly", priority: "0.6" },
  { path: "/blog", changefreq: "weekly", priority: "0.8" },
  { path: "/contact", changefreq: "monthly", priority: "0.6" },
  // Academy
  { path: "/academy", changefreq: "weekly", priority: "0.9" },
  { path: "/academy/online-courses", changefreq: "weekly", priority: "0.8" },
  { path: "/academy/offline-training", changefreq: "monthly", priority: "0.7" },
  { path: "/academy/certifications", changefreq: "monthly", priority: "0.7" },
  { path: "/academy/placements", changefreq: "monthly", priority: "0.7" },
  { path: "/academy/internships", changefreq: "monthly", priority: "0.7" },
  { path: "/academy/corporate-training", changefreq: "monthly", priority: "0.7" },
  { path: "/academy/success-stories", changefreq: "monthly", priority: "0.6" },
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
  { path: "/technologies/case-studies", changefreq: "monthly", priority: "0.7" },
  { path: "/technologies/industries", changefreq: "monthly", priority: "0.6" },
  { path: "/technologies/careers", changefreq: "weekly", priority: "0.6" },
  { path: "/technologies/contact", changefreq: "monthly", priority: "0.6" },
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
      GET: async () => {
        const entries: SitemapEntry[] = [
          ...STATIC_ENTRIES,
          ...BLOG_SLUGS.map((slug) => ({ path: `/blog/${slug}`, changefreq: "monthly" as const, priority: "0.6" })),
          ...JOB_SLUGS.map((slug) => ({ path: `/careers/${slug}`, changefreq: "weekly" as const, priority: "0.5" })),
        ];

        const urls = entries
          .map((e) =>
            [
              `  <url>`,
              `    <loc>${BASE_URL}${e.path}</loc>`,
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
