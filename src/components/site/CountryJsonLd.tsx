import { getCountryData } from "@/lib/countries-data";
import { SITE } from "@/lib/site";

const abs = (p: string) => `${SITE.url}${p.startsWith("/") ? p : `/${p}`}`;

/**
 * Builds AdministrativeArea JSON-LD for a country page.
 * Uses actual country data from the registry.
 */
export function buildCountryJsonLd(slug: string) {
  const country = getCountryData(slug);
  if (!country) return null;
  
  const url = abs(`/global-education/countries/${slug}`);
  
  return {
    "@context": "https://schema.org",
    "@type": "AdministrativeArea",
    "@id": `${url}#country`,
    name: country.name,
    description: country.summary,
    url,
    containedInPlace: {
      "@type": "Country",
      name: "World",
    },
    geo: {
      "@type": "GeoCoordinates",
      // Approximate centroid coordinates - in production, use actual country centroids
    },
    address: {
      "@type": "PostalAddress",
      addressCountry: country.name,
    },
    // Study destination specific properties
    "studyDestinationInfo": {
      "@type": "StructuredValue",
      primaryLanguage: country.primaryLanguage,
      popularIntakes: country.popularIntakes,
      visaTypes: country.visaTypes,
      workRights: country.workRights,
      postStudyWork: country.postStudyWork,
      avgTuitionUsd: country.avgTuitionUsd,
      costOfLivingUsd: country.costOfLivingUsd,
      topUniversities: country.topUniversities,
      scholarships: country.scholarships,
    },
    // HIGAET-specific
    "higaetServices": {
      "@type": "Service",
      name: `Study in ${country.name} Counselling`,
      provider: {
        "@id": `${SITE.url}/#global-education-hub`,
        name: "HIGAET Global Education Hub",
      },
      serviceType: "Study Abroad Counselling",
      areaServed: "Worldwide",
      availableChannel: {
        "@type": "ServiceChannel",
        serviceUrl: abs("/global-education/contact"),
      },
    },
  };
}

/**
 * Builds BreadcrumbList JSON-LD for country pages.
 */
export function buildCountryBreadcrumbJsonLd(slug: string) {
  const country = getCountryData(slug);
  if (!country) return null;
  
  const url = abs(`/global-education/countries/${slug}`);
  
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: abs("/") },
      { "@type": "ListItem", position: 2, name: "Global Education Hub", item: abs("/global-education") },
      { "@type": "ListItem", position: 3, name: "Countries", item: abs("/global-education/countries") },
      { "@type": "ListItem", position: 4, name: country.name, item: url },
    ],
  };
}

/**
 * Builds FAQPage JSON-LD for country pages from visaProcess data.
 */
export function buildCountryFaqJsonLd(slug: string) {
  const country = getCountryData(slug);
  if (!country || !country.visaProcess?.length) return null;
  
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: country.visaProcess.map((step, index) => ({
      "@type": "Question",
      name: `Step ${index + 1}: ${step}`,
      acceptedAnswer: {
        "@type": "Answer",
        text: step,
      },
    })),
  };
}
