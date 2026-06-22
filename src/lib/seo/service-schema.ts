import { buildBreadcrumbJsonLd } from "@/lib/seo/course-schema";

const BASE = "https://higaet.com";

const PROVIDER = {
  "@type": "Organization",
  "@id": `${BASE}/higaet-global-education-hub#org`,
  name: "HIGAET Global Education Hub",
  url: `${BASE}/higaet-global-education-hub`,
  parentOrganization: {
    "@type": "Organization",
    "@id": `${BASE}/about-higaet#org`,
    name: "HIGAET",
    url: `${BASE}/about-higaet`,
  },
} as const;

export type ServiceSchemaInput = {
  path: string; // e.g. "/global-education/visa-guidance"
  name: string;
  description: string;
  serviceType: string; // e.g. "Visa Guidance"
  areaServed?: string | string[];
  audience?: string;
  howTo?: { name: string; steps: { name: string; text: string }[] };
  faqs?: { q: string; a: string }[];
  breadcrumbs: { name: string; url: string }[];
};

export function buildServiceJsonLdScripts(input: ServiceSchemaInput) {
  const url = `${BASE}${input.path}`;
  const scripts: { type: string; children: string }[] = [];

  scripts.push({
    type: "application/ld+json",
    children: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": `${url}#service`,
      name: input.name,
      description: input.description,
      serviceType: input.serviceType,
      url,
      provider: PROVIDER,
      areaServed: input.areaServed ?? ["India", "Global"],
      audience: { "@type": "EducationalAudience", educationalRole: input.audience ?? "International student" },
      category: "International Education Services",
    }),
  });

  if (input.howTo) {
    scripts.push({
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: input.howTo.name,
        description: input.description,
        step: input.howTo.steps.map((s, i) => ({
          "@type": "HowToStep",
          position: i + 1,
          name: s.name,
          text: s.text,
          url: `${url}#step-${i + 1}`,
        })),
      }),
    });
  }

  if (input.faqs && input.faqs.length) {
    scripts.push({
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: input.faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      }),
    });
  }

  scripts.push({
    type: "application/ld+json",
    children: JSON.stringify(buildBreadcrumbJsonLd(input.breadcrumbs)),
  });

  return scripts;
}
