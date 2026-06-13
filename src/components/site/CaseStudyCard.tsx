import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type CaseStudy = {
  slug?: string;
  industry: string;
  title: string;
  summary: string;
  metrics?: { value: string; label: string }[];
  stack?: string[];
  href?: string;
};

export function CaseStudyCard({
  caseStudy: cs,
  className,
}: {
  caseStudy: CaseStudy;
  className?: string;
}) {
  const Inner = (
    <article
      className={cn(
        "group flex h-full flex-col rounded-2xl bg-card p-7 ring-1 ring-border transition hover:ring-foreground/30 [box-shadow:var(--shadow-card)]",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-tech">
          {cs.industry}
        </span>
        {cs.href && (
          <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        )}
      </div>
      <h3 className="mt-4 font-display text-xl font-medium text-ink text-balance">{cs.title}</h3>
      <p className="mt-3 text-sm text-muted-foreground leading-relaxed flex-1">{cs.summary}</p>

      {cs.metrics && cs.metrics.length > 0 && (
        <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-border pt-5">
          {cs.metrics.map((m) => (
            <div key={m.label}>
              <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {m.label}
              </dt>
              <dd className="mt-1 font-display text-xl text-ink">{m.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {cs.stack && cs.stack.length > 0 && (
        <ul className="mt-5 flex flex-wrap gap-1.5">
          {cs.stack.map((t) => (
            <li
              key={t}
              className="rounded-md bg-muted/70 px-2 py-0.5 text-[11px] font-medium text-ink"
            >
              {t}
            </li>
          ))}
        </ul>
      )}
    </article>
  );

  return cs.href ? (
    <Link to={cs.href} className="block h-full">
      {Inner}
    </Link>
  ) : (
    Inner
  );
}
