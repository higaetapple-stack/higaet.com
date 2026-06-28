/**
 * JSON-LD schema builders for HIGAET. All produce schema.org structures
 * with absolute URLs anchored to SITE.url so AI search engines
 * (ChatGPT, Perplexity, Gemini, Claude) can ground entities reliably.
 */
import { SITE } from "@/lib/site";

const abs = (href: string) =>
  href.startsWith("http") ? href : `${SITE.url}${href.startsWith("/") ? href : `/${href}`}`;

const ORG_ID = `${SITE.url}/#organization`;

/** WebPage envelope for any standalone marketing page. */
export function webPageJsonLd(opts: {
  path: string;
  name: string;
  description: string;
  inLanguage?: string;
  primaryImageOfPage?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${abs(opts.path)}#webpage`,
    url: abs(opts.path),
    name: opts.name,
    description: opts.description,
    inLanguage: opts.inLanguage ?? "en",
    isPartOf: { "@id": `${SITE.url}/#website` },
    about: { "@id": ORG_ID },
    ...(opts.primaryImageOfPage
      ? { primaryImageOfPage: { "@type": "ImageObject", url: abs(opts.primaryImageOfPage) } }
      : {}),
  };
}

/** Article / TechArticle for blog posts and docs. */
export function articleJsonLd(opts: {
  type?: "Article" | "TechArticle" | "BlogPosting" | "NewsArticle";
  path: string;
  headline: string;
  description: string;
  datePublished?: string;
  dateModified?: string;
  image?: string;
  authorName?: string;
  keywords?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": opts.type ?? "Article",
    "@id": `${abs(opts.path)}#article`,
    headline: opts.headline,
    description: opts.description,
    mainEntityOfPage: { "@type": "WebPage", "@id": abs(opts.path) },
    image: opts.image ? abs(opts.image) : `${SITE.url}/og-higaet.png`,
    datePublished: opts.datePublished,
    dateModified: opts.dateModified ?? opts.datePublished,
    author: opts.authorName
      ? { "@type": "Person", name: opts.authorName }
      : { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
    inLanguage: "en",
    ...(opts.keywords?.length ? { keywords: opts.keywords.join(", ") } : {}),
  };
}

/** Course for HIGAET Academy programs and certifications. */
export function courseJsonLd(opts: {
  path: string;
  name: string;
  description: string;
  courseCode?: string;
  educationalLevel?: string;
  timeRequired?: string; // ISO 8601 duration, e.g. "P6M"
  inLanguage?: string;
  about?: string[];
  offers?: { price: string; priceCurrency: string };
  hasCourseInstance?: { courseMode: string; courseWorkload?: string };
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    "@id": `${abs(opts.path)}#course`,
    name: opts.name,
    description: opts.description,
    url: abs(opts.path),
    provider: { "@id": `${SITE.url}/#academy` },
    inLanguage: opts.inLanguage ?? "en",
    ...(opts.courseCode ? { courseCode: opts.courseCode } : {}),
    ...(opts.educationalLevel ? { educationalLevel: opts.educationalLevel } : {}),
    ...(opts.timeRequired ? { timeRequired: opts.timeRequired } : {}),
    ...(opts.about ? { about: opts.about } : {}),
    ...(opts.offers
      ? { offers: { "@type": "Offer", category: "Paid", ...opts.offers, url: abs(opts.path) } }
      : { offers: { "@type": "Offer", category: "Education" } }),
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: opts.hasCourseInstance?.courseMode ?? "Online",
      ...(opts.hasCourseInstance?.courseWorkload
        ? { courseWorkload: opts.hasCourseInstance.courseWorkload }
        : {}),
    },
  };
}

/** CollegeOrUniversity for global education partner universities. */
export function universityJsonLd(opts: {
  path: string;
  name: string;
  description: string;
  city?: string;
  country?: string;
  logo?: string;
  sameAs?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollegeOrUniversity",
    "@id": `${abs(opts.path)}#university`,
    name: opts.name,
    description: opts.description,
    url: abs(opts.path),
    ...(opts.logo ? { logo: abs(opts.logo) } : {}),
    ...(opts.sameAs?.length ? { sameAs: opts.sameAs } : {}),
    ...(opts.city || opts.country
      ? {
          address: {
            "@type": "PostalAddress",
            ...(opts.city ? { addressLocality: opts.city } : {}),
            ...(opts.country ? { addressCountry: opts.country } : {}),
          },
        }
      : {}),
  };
}

/** JobPosting for /jobs/* pages. */
export function jobPostingJsonLd(opts: {
  path: string;
  title: string;
  description: string;
  datePosted: string;
  validThrough?: string;
  employmentType?: string;
  hiringOrganization?: { name: string; sameAs?: string };
  jobLocation?: { city?: string; region?: string; country?: string };
  remote?: boolean;
  baseSalary?: { currency: string; value: number; unitText: "HOUR" | "MONTH" | "YEAR" };
}) {
  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "@id": `${abs(opts.path)}#job`,
    title: opts.title,
    description: opts.description,
    datePosted: opts.datePosted,
    ...(opts.validThrough ? { validThrough: opts.validThrough } : {}),
    employmentType: opts.employmentType ?? "FULL_TIME",
    hiringOrganization: opts.hiringOrganization
      ? {
          "@type": "Organization",
          name: opts.hiringOrganization.name,
          ...(opts.hiringOrganization.sameAs ? { sameAs: opts.hiringOrganization.sameAs } : {}),
        }
      : { "@id": ORG_ID },
    ...(opts.remote
      ? {
          jobLocationType: "TELECOMMUTE",
          applicantLocationRequirements: { "@type": "Country", name: "Worldwide" },
        }
      : {}),
    ...(opts.jobLocation
      ? {
          jobLocation: {
            "@type": "Place",
            address: {
              "@type": "PostalAddress",
              ...(opts.jobLocation.city ? { addressLocality: opts.jobLocation.city } : {}),
              ...(opts.jobLocation.region ? { addressRegion: opts.jobLocation.region } : {}),
              ...(opts.jobLocation.country ? { addressCountry: opts.jobLocation.country } : {}),
            },
          },
        }
      : {}),
    ...(opts.baseSalary
      ? {
          baseSalary: {
            "@type": "MonetaryAmount",
            currency: opts.baseSalary.currency,
            value: {
              "@type": "QuantitativeValue",
              value: opts.baseSalary.value,
              unitText: opts.baseSalary.unitText,
            },
          },
        }
      : {}),
  };
}

/** Service for HIGAET Technologies offerings. */
export function serviceJsonLd(opts: {
  path: string;
  name: string;
  description: string;
  serviceType?: string;
  areaServed?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${abs(opts.path)}#service`,
    name: opts.name,
    description: opts.description,
    url: abs(opts.path),
    provider: { "@id": `${SITE.url}/#technologies` },
    ...(opts.serviceType ? { serviceType: opts.serviceType } : {}),
    areaServed: opts.areaServed ?? "Worldwide",
  };
}
