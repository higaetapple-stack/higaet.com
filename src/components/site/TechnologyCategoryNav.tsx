import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Section, Eyebrow } from "./Section";
import { ALL_TECHNOLOGIES, TECH_CATEGORIES } from "@/content/technologies.index";

type Props = { currentSlug: string };

export function TechnologyCategoryNav({ currentSlug }: Props) {
  const flat = TECH_CATEGORIES.flatMap((c) => c.slugs).filter((s) => ALL_TECHNOLOGIES[s]);
  const idx = flat.indexOf(currentSlug);
  const prev = idx > 0 ? ALL_TECHNOLOGIES[flat[idx - 1]] : null;
  const next = idx >= 0 && idx < flat.length - 1 ? ALL_TECHNOLOGIES[flat[idx + 1]] : null;

  return (
    <Section id="tech-map" className="bg-muted/30 border-t border-border">
      <Eyebrow brand="tech">All HIGAET technology expertise</Eyebrow>
      <h2 className="mt-4 mb-10 font-display text-2xl md:text-3xl font-medium tracking-tight text-ink text-balance max-w-[42ch]">
        Explore every technology HIGAET Technologies ships in production.
      </h2>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {TECH_CATEGORIES.map((cat) => (
          <div key={cat.id}>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-tech">
              {cat.label}
            </h3>
            <ul className="mt-4 space-y-2">
              {cat.slugs
                .filter((s) => ALL_TECHNOLOGIES[s])
                .map((slug) => {
                  const t = ALL_TECHNOLOGIES[slug];
                  const isCurrent = slug === currentSlug;
                  return (
                    <li key={slug}>
                      <Link
                        to={t.path}
                        aria-current={isCurrent ? "page" : undefined}
                        className={
                          isCurrent
                            ? "text-sm font-medium text-ink"
                            : "text-sm text-muted-foreground hover:text-ink transition-colors"
                        }
                      >
                        {t.eyebrow}
                      </Link>
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
      </div>

      {(prev || next) && (
        <nav aria-label="Technology pagination" className="mt-12 grid gap-4 border-t border-border pt-8 md:grid-cols-2">
          {prev ? (
            <Link to={prev.path} rel="prev" className="group flex items-start gap-3 rounded-2xl bg-card p-5 ring-1 ring-border transition hover:ring-foreground/30">
              <ArrowLeft className="mt-1 size-4 text-muted-foreground transition-transform group-hover:-translate-x-0.5" />
              <span className="flex-1">
                <span className="block text-xs uppercase tracking-wider text-muted-foreground">Previous technology</span>
                <span className="mt-1 block font-display text-base font-medium text-ink">{prev.eyebrow}</span>
              </span>
            </Link>
          ) : (<span />)}
          {next ? (
            <Link to={next.path} rel="next" className="group flex items-start gap-3 rounded-2xl bg-card p-5 ring-1 ring-border transition hover:ring-foreground/30 md:text-right">
              <span className="flex-1">
                <span className="block text-xs uppercase tracking-wider text-muted-foreground">Next technology</span>
                <span className="mt-1 block font-display text-base font-medium text-ink">{next.eyebrow}</span>
              </span>
              <ArrowRight className="mt-1 size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          ) : (<span />)}
        </nav>
      )}
    </Section>
  );
}
