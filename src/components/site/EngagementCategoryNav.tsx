import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Section, Eyebrow } from "./Section";
import { ENGAGEMENT_MODELS, ENGAGEMENT_SLUGS } from "@/content/engagement";

type Props = { currentSlug: string };

export function EngagementCategoryNav({ currentSlug }: Props) {
  const flat = [...ENGAGEMENT_SLUGS];
  const idx = flat.indexOf(currentSlug as (typeof ENGAGEMENT_SLUGS)[number]);
  const prev = idx > 0 ? ENGAGEMENT_MODELS[flat[idx - 1]] : null;
  const next = idx >= 0 && idx < flat.length - 1 ? ENGAGEMENT_MODELS[flat[idx + 1]] : null;

  return (
    <Section id="engagement-map" className="bg-muted/30 border-t border-border">
      <Eyebrow brand="tech">All HIGAET engagement models</Eyebrow>
      <h2 className="mt-4 mb-10 font-display text-2xl md:text-3xl font-medium tracking-tight text-ink text-balance max-w-[42ch]">
        Pick the engagement that matches your risk, scope, and scale.
      </h2>

      <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {flat.map((slug) => {
          const m = ENGAGEMENT_MODELS[slug];
          const isCurrent = slug === currentSlug;
          const Icon = m.icon;
          return (
            <li key={slug}>
              <Link
                to={m.path}
                aria-current={isCurrent ? "page" : undefined}
                className={
                  "flex items-start gap-3 rounded-2xl p-4 ring-1 transition " +
                  (isCurrent
                    ? "bg-ink text-surface ring-ink"
                    : "bg-card text-ink ring-border hover:ring-foreground/30")
                }
              >
                <Icon className={"mt-0.5 size-5 shrink-0 " + (isCurrent ? "text-surface" : "text-tech")} aria-hidden />
                <span>
                  <span className="block font-display text-sm font-medium">{m.eyebrow}</span>
                  <span className={"mt-1 block text-xs leading-relaxed " + (isCurrent ? "text-surface/70" : "text-muted-foreground")}>
                    {m.tagline}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {(prev || next) && (
        <nav aria-label="Engagement pagination" className="mt-12 grid gap-4 border-t border-border pt-8 md:grid-cols-2">
          {prev ? (
            <Link to={prev.path} rel="prev" className="group flex items-start gap-3 rounded-2xl bg-card p-5 ring-1 ring-border transition hover:ring-foreground/30">
              <ArrowLeft className="mt-1 size-4 text-muted-foreground transition-transform group-hover:-translate-x-0.5" />
              <span className="flex-1">
                <span className="block text-xs uppercase tracking-wider text-muted-foreground">Previous model</span>
                <span className="mt-1 block font-display text-base font-medium text-ink">{prev.eyebrow}</span>
              </span>
            </Link>
          ) : (<span />)}
          {next ? (
            <Link to={next.path} rel="next" className="group flex items-start gap-3 rounded-2xl bg-card p-5 ring-1 ring-border transition hover:ring-foreground/30 md:text-right">
              <span className="flex-1">
                <span className="block text-xs uppercase tracking-wider text-muted-foreground">Next model</span>
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
