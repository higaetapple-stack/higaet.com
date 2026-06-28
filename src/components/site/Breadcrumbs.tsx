import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { Fragment } from "react";
import { cn } from "@/lib/utils";
import { SITE } from "@/lib/site";

export type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn("text-xs text-muted-foreground", className)}>
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <Fragment key={`${c.label}-${i}`}>
              <li className={cn(last && "text-ink font-medium")}>
                {c.href && !last ? (
                  <Link to={c.href} className="hover:text-ink transition-colors">
                    {c.label}
                  </Link>
                ) : (
                  <span aria-current={last ? "page" : undefined}>{c.label}</span>
                )}
              </li>
              {!last && <ChevronRight className="size-3 shrink-0 opacity-50" aria-hidden />}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * Build crumbs from a pathname, e.g. "/academy/programs" →
 * [Home, Academy, Programs] with labels humanised from slugs.
 * The final segment has no href (current page). Skips empty segments.
 */
export function crumbsFromPath(pathname: string, labelOverrides: Record<string, string> = {}): Crumb[] {
  const parts = pathname.split("/").filter(Boolean);
  const crumbs: Crumb[] = [{ label: "Home", href: "/" }];
  let acc = "";
  parts.forEach((seg, i) => {
    acc += `/${seg}`;
    const human =
      labelOverrides[acc] ??
      seg
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
    crumbs.push({ label: human, href: i === parts.length - 1 ? undefined : acc });
  });
  return crumbs;

/** Build a BreadcrumbList JSON-LD block. Hrefs are absolutised to SITE.url for AI/LLM grounding. */
export function breadcrumbJsonLd(items: Crumb[]) {
  const abs = (href: string) =>
    href.startsWith("http") ? href : `${SITE.url}${href.startsWith("/") ? href : `/${href}`}`;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      ...(c.href ? { item: abs(c.href) } : {}),
    })),
  };
}
