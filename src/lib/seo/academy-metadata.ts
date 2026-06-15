/**
 * HIGAET Academy — SEO Metadata Builders (B.5)
 * ---------------------------------------------------------------
 * Pure helpers consumed by Academy route `head()` blocks. Build:
 *   - canonical + og:url (self-referencing, leaf-only canonical)
 *   - JSON-LD: CollectionPage, ItemList, BreadcrumbList,
 *     EducationalOrganization, Course, Review
 *
 * Rules:
 *   - Pure functions. No side effects. SSR-safe.
 *   - Absolute URLs only, anchored at ACADEMY_SITEMAP_BASE_URL
 *     (single source of truth, reused from the sitemap generator).
 *   - No og:image emitted — placeholder previews are a net negative.
 * ---------------------------------------------------------------
 */

import { ACADEMY_SITEMAP_BASE_URL } from "@/content/academy/generated/sitemap";
import type {
  CategoryEntry,
  CourseEntry,
  LearningPathEntry,
  TestimonialEntry,
  BreadcrumbEntry,
} from "@/content/providers";

type MetaTag =
  | { title: string }
  | { name: string; content: string }
  | { property: string; content: string };

type LinkTag = { rel: string; href: string };

type ScriptTag = {
  type: "application/ld+json";
  children: string;
};

export interface AcademyHeadInput {
  title: string;
  description: string;
  /** Root-relative path, e.g. "/academy/online-courses". */
  path: string;
  /** Defaults to "website"; use "article" on editorial routes. */
  ogType?: string;
}

/** Build absolute URL from a root-relative path. */
export function absoluteUrl(path: string): string {
  return `${ACADEMY_SITEMAP_BASE_URL}${path}`;
}

/** Standard meta + canonical block. Title is a meta entry (per head-meta rules). */
export function buildAcademyHeadMeta(
  input: AcademyHeadInput,
): { meta: MetaTag[]; links: LinkTag[] } {
  const url = absoluteUrl(input.path);
  return {
    meta: [
      { title: input.title },
      { name: "description", content: input.description },
      { property: "og:title", content: input.title },
      { property: "og:description", content: input.description },
      { property: "og:url", content: url },
      { property: "og:type", content: input.ogType ?? "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: input.title },
      { name: "twitter:description", content: input.description },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}

function jsonLd(payload: unknown): ScriptTag {
  return {
    type: "application/ld+json",
    children: JSON.stringify(payload),
  };
}

/** BreadcrumbList from a registry breadcrumb trail. */
export function buildBreadcrumbJsonLd(
  trail: readonly BreadcrumbEntry[],
): ScriptTag {
  return jsonLd({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: crumb.label,
      ...(crumb.url ? { item: absoluteUrl(crumb.url) } : {}),
    })),
  });
}

/** CollectionPage for a category landing, with its courses as hasPart. */
export function buildCollectionJsonLd(
  category: CategoryEntry,
  courses: readonly CourseEntry[],
  path: string,
): ScriptTag {
  return jsonLd({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: category.metadata.title,
    description: category.metadata.description,
    url: absoluteUrl(path),
    isPartOf: { "@type": "WebSite", name: "HIGAET Academy" },
    hasPart: courses.map((c) => ({
      "@type": "Course",
      name: c.title,
      description: c.summary,
      provider: {
        "@type": "EducationalOrganization",
        name: "HIGAET Academy",
      },
    })),
  });
}

/** ItemList for a listing page (e.g. learning paths index). */
export function buildLearningPathsItemListJsonLd(
  paths: readonly LearningPathEntry[],
  basePath: string,
): ScriptTag {
  return jsonLd({
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: paths.map((p, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: p.title,
      description: p.summary,
      url: absoluteUrl(`${basePath}/${p.slug}`),
    })),
  });
}

/** Reviews block (success stories). */
export function buildReviewsJsonLd(
  testimonials: readonly TestimonialEntry[],
): ScriptTag {
  return jsonLd({
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: testimonials.map((t, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      item: {
        "@type": "Review",
        reviewBody: t.quote,
        author: {
          "@type": "Person",
          name: t.name,
          ...(t.role ? { jobTitle: t.role } : {}),
        },
        itemReviewed: {
          "@type": "EducationalOrganization",
          name: "HIGAET Academy",
        },
      },
    })),
  });
}

/** EducationalOrganization block for the Academy homepage. */
export function buildEducationalOrgJsonLd(path: string): ScriptTag {
  return jsonLd({
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: "HIGAET Academy",
    url: absoluteUrl(path),
    parentOrganization: {
      "@type": "Organization",
      name: "HIGAET",
      url: ACADEMY_SITEMAP_BASE_URL,
    },
  });
}

/** Course JSON-LD (deferred until course detail routes ship; helper ready). */
export function buildCourseJsonLd(
  course: CourseEntry,
  path: string,
): ScriptTag {
  return jsonLd({
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.summary,
    url: absoluteUrl(path),
    provider: {
      "@type": "EducationalOrganization",
      name: "HIGAET Academy",
      url: absoluteUrl("/academy"),
    },
    ...(course.duration ? { timeRequired: course.duration } : {}),
  });
}
