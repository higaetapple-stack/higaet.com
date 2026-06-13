import { Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type EngagementModel = {
  name: string;
  tagline: string;
  bestFor: string;
  features: string[];
  href?: string;
  ctaLabel?: string;
  highlighted?: boolean;
};

export function EngagementModelCard({
  model,
  className,
}: {
  model: EngagementModel;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-2xl p-7 ring-1 transition",
        model.highlighted
          ? "bg-ink text-surface ring-ink [box-shadow:var(--shadow-elevated)]"
          : "bg-card text-ink ring-border [box-shadow:var(--shadow-card)] hover:ring-foreground/30",
        className,
      )}
    >
      <div>
        <h3 className="font-display text-xl font-medium">{model.name}</h3>
        <p
          className={cn(
            "mt-2 text-sm leading-relaxed",
            model.highlighted ? "text-surface/70" : "text-muted-foreground",
          )}
        >
          {model.tagline}
        </p>
      </div>

      <div className="my-6 h-px bg-[var(--gradient-divider)]" />

      <p
        className={cn(
          "text-[11px] font-semibold uppercase tracking-widest",
          model.highlighted ? "text-surface/60" : "text-muted-foreground",
        )}
      >
        Best for
      </p>
      <p className="mt-1.5 text-sm leading-relaxed">{model.bestFor}</p>

      <ul className="mt-6 space-y-2.5 text-sm">
        {model.features.map((f) => (
          <li key={f} className="flex gap-2.5">
            <Check
              className={cn(
                "mt-0.5 size-4 shrink-0",
                model.highlighted ? "text-surface" : "text-tech",
              )}
              aria-hidden
            />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      {model.href && (
        <Link
          to={model.href}
          className={cn(
            "mt-7 inline-flex items-center gap-1.5 text-sm font-medium",
            model.highlighted ? "text-surface hover:opacity-80" : "text-ink hover:text-tech",
          )}
        >
          {model.ctaLabel ?? "Learn more"}
          <ArrowRight className="size-4" />
        </Link>
      )}
    </article>
  );
}
