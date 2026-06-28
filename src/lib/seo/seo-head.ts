/**
 * Reusable per-route head() builder.
 *
 * Root (__root.tsx) already emits:
 *   - canonical (absolute, isomorphic pathname)
 *   - og:site_name, og:image, twitter:* defaults
 *   - robots index/noindex per private-path policy
 *   - Organization + WebSite JSON-LD
 *
 * Leaves call seoHead({...}) to override title/description/og:title/og:description
 * /og:url/og:type, stack JSON-LD (BreadcrumbList, FAQPage, Course, etc.), and pass
 * extra meta. TanStack meta dedupes by name/property, so leaf entries override root.
 *
 * Do NOT emit `rel: "canonical"` here — root is the sole canonical source.
 */
import { SITE } from "@/lib/site";

export interface SeoHeadInput {
  /** Route pathname starting with "/", e.g. "/academy/programs" */
  path: string;
  title: string;
  description: string;
  /** og:type — default "website". Use "article" / "profile" / "product" as appropriate. */
  ogType?: string;
  /** Per-route share image (absolute or absolute path under SITE.url). Falls back to default site OG. */
  image?: string;
  /** Stackable JSON-LD blocks (Article, BreadcrumbList, FAQPage, Course, JobPosting, …). */
  jsonLd?: unknown[];
  /** Extra meta entries (e.g. article:published_time). */
  extraMeta?: Array<Record<string, string>>;
  /** Hard noindex flag for individual leaves (e.g. unpublished previews). */
  noindex?: boolean;
}

const abs = (href: string) =>
  href.startsWith("http") ? href : `${SITE.url}${href.startsWith("/") ? href : `/${href}`}`;

export function seoHead(input: SeoHeadInput) {
  const url = abs(input.path);
  const image = input.image ? abs(input.image) : `${SITE.url}/og-higaet.png`;
  const ogType = input.ogType ?? "website";

  const meta: Array<Record<string, string>> = [
    { title: input.title },
    { name: "description", content: input.description },
    { property: "og:title", content: input.title },
    { property: "og:description", content: input.description },
    { property: "og:type", content: ogType },
    { property: "og:url", content: url },
    { property: "og:image", content: image },
    { property: "og:image:alt", content: input.title },
    { property: "og:site_name", content: SITE.name },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: input.title },
    { name: "twitter:description", content: input.description },
    { name: "twitter:image", content: image },
    { name: "twitter:site", content: SITE.twitter },
  ];

  if (input.noindex) {
    meta.push({ name: "robots", content: "noindex, nofollow" });
  }

  if (input.extraMeta) meta.push(...input.extraMeta);

  const scripts = (input.jsonLd ?? []).map((data) => ({
    type: "application/ld+json" as const,
    children: JSON.stringify(data),
  }));

  return { meta, scripts };
}
