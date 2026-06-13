import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Section, Eyebrow } from "./Section";
import { ALL_INDUSTRIES, INDUSTRY_CATEGORIES } from "@/content/industries.index";

type Props = { currentSlug: string };

/**
 * In-page navigator listing every industry grouped by category, plus a
 * previous/next pair derived from the flattened catalog ordering. Mirrors
 * the service-level catalog component for consistency and internal linking.
 */
export function IndustryCategoryNav({ currentSlug }: Props) {
  const flat = INDUSTRY_CATEGORIES.flatMap((c) => c.slugs).filter((s) => ALL_INDUSTRIES[s]);
  const idx = flat.indexOf(currentSlug);
  const prev = idx > 0 ? ALL_INDUSTRIES[flat[idx - 1]] : null;
  const next = idx >= 0 && idx < flat.length - 1 ? ALL_INDUSTRIES[flat[idx + 1]] : null;

  return (
    <Section id="industries-map" className="bg-muted/30 border-t border-border">
      <Eyebrow brand="tech">All HIGAET Technologies industries</Eyebrow>
      <h2 className="mt-4 mb-10 font-display text-2xl md:text-3xl font-medium tracking-tight text-ink text-balance max-w-[42ch]">
        Explore every sector HIGAET Technologies serves.
      </h2>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {INDUSTRY_CATEGORIES.map((cat) => (
          <div key={cat.id}>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-tech">
              {cat.label}
            </h3>
            <ul className="mt-4 space-y-2">
              {cat.slugs
                .filter((s) => ALL_INDUSTRIES[s])
                .map((slug) => {
                  const ind = ALL_INDUSTRIES[slug];
                  const isCurrent = slug === currentSlug;
                  return (
                    <li key={slug}>
                      <Link
                        to={ind.path}
                        aria-current={isCurrent ? "page" : undefined}
                        className={
                          isCurrent
                            ? "text-sm font-medium text-ink"
                            : "text-sm text-muted-foreground hover:text-ink transition-colors"
                        }
                      >
                        {ind.eyebrow}
                      </Link>
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
      </div>

      {(prev || next) && (
        <nav
          aria-label="Industry pagination"
          className="mt-12 grid gap-4 border-t border-border pt-8 md:grid-cols-2"
        >
          {prev ? (
            <Link
              to={prev.path}
              rel="prev"
              className="group flex items-start gap-3 rounded-2xl bg-card p-5 ring-1 ring-border transition hover:ring-foreground/30"
            >
              <ArrowLeft className="mt-1 size-4 text-muted-foreground transition-transform group-hover:-translate-x-0.5" />
              <span className="flex-1">
                <span className="block text-xs uppercase tracking-wider text-muted-foreground">
                  Previous industry
                </span>
                <span className="mt-1 block font-display text-base font-medium text-ink">
                  {prev.eyebrow}
                </span>
              </span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              to={next.path}
              rel="next"
              className="group flex items-start gap-3 rounded-2xl bg-card p-5 ring-1 ring-border transition hover:ring-foreground/30 md:text-right"
            >
              <span className="flex-1">
                <span className="block text-xs uppercase tracking-wider text-muted-foreground">
                  Next industry
                </span>
                <span className="mt-1 block font-display text-base font-medium text-ink">
                  {next.eyebrow}
                </span>
              </span>
              <ArrowRight className="mt-1 size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </Section>
  );
}
