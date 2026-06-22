import type { Program } from "@/lib/academy-programs";
import { CATEGORY_LABELS, type ProgramCategory } from "@/lib/academy-programs";

const PROVIDER = {
  "@type": "EducationalOrganization",
  "@id": "https://higaet.com/higaet-academy#org",
  name: "HIGAET Academy",
  url: "https://higaet.com/higaet-academy",
  sameAs: [
    "https://higaet.com/about-higaet",
    "https://higaet.com/higaet-academy",
  ],
} as const;

function parseDurationToISO(duration: string): string | undefined {
  // e.g. "6 months", "12 weeks", "9 Months"
  const m = duration.match(/(\d+)\s*(month|week|day|year)/i);
  if (!m) return undefined;
  const n = m[1];
  const unit = m[2].toLowerCase();
  const map: Record<string, string> = { day: "D", week: "W", month: "M", year: "Y" };
  const code = map[unit];
  if (!code) return undefined;
  return code === "Y" || code === "M" ? `P${n}${code}` : `P${n}${code}`;
}

export function buildCourseJsonLd(program: Program, slug: string) {
  const url = `https://higaet.com/academy/programs/${slug}`;
  const iso = parseDurationToISO(program.duration);

  return {
    "@context": "https://schema.org",
    "@type": "Course",
    "@id": `${url}#course`,
    name: program.title,
    description: program.tagline,
    url,
    courseCode: program.slug,
    educationalLevel: program.level,
    about: CATEGORY_LABELS[program.category as ProgramCategory],
    teaches: program.outcomes,
    inLanguage: "en",
    provider: PROVIDER,
    offers: {
      "@type": "Offer",
      price: program.feeINR.replace(/[^\d.]/g, "") || undefined,
      priceCurrency: "INR",
      category: "Tuition",
      url,
      availability: "https://schema.org/InStock",
    },
    hasCourseInstance: [
      {
        "@type": "CourseInstance",
        courseMode: program.format === "Online" ? "Online" : program.format === "On-campus" ? "Onsite" : "Blended",
        courseWorkload: iso,
        startDate: program.startDate,
        location: program.format === "Online"
          ? { "@type": "VirtualLocation", url }
          : { "@type": "Place", name: "HIGAET Academy Campus", address: "India" },
        instructor: program.faculty.map((f) => ({
          "@type": "Person",
          name: f.name,
          jobTitle: f.role,
          description: f.bio,
          worksFor: PROVIDER,
        })),
      },
    ],
    coursePrerequisites: program.eligibility,
    occupationalCredentialAwarded: {
      "@type": "EducationalOccupationalCredential",
      name: `${program.title} Certificate`,
      credentialCategory: "Certificate",
      recognizedBy: PROVIDER,
    },
  };
}

export function buildBreadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url.startsWith("http") ? it.url : `https://higaet.com${it.url}`,
    })),
  };
}

export function buildProviderJsonLd() {
  return { "@context": "https://schema.org", ...PROVIDER };
}
