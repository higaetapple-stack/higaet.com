import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type Industry = {
  icon: ComponentType<LucideProps>;
  name: string;
  body: string;
  href?: string;
};

export function IndustryCard({ industry, className }: { industry: Industry; className?: string }) {
  const Icon = industry.icon;
  const Inner = (
    <>
      <div className="mb-5 flex size-11 items-center justify-center rounded-lg bg-tech/10 text-tech">
        <Icon className="size-5" aria-hidden />
      </div>
      <h3 className="font-display text-lg font-medium text-ink flex items-center gap-2">
        {industry.name}
        {industry.href && (
          <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        )}
      </h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{industry.body}</p>
    </>
  );

  const baseClass = cn(
    "group block rounded-2xl bg-card p-6 ring-1 ring-border transition hover:ring-foreground/30 [box-shadow:var(--shadow-card)]",
    className,
  );

  return industry.href ? (
    <Link to={industry.href} className={baseClass}>
      {Inner}
    </Link>
  ) : (
    <article className={baseClass}>{Inner}</article>
  );
}

export function IndustryGrid({
  industries,
  columns = 3,
}: {
  industries: Industry[];
  columns?: 2 | 3 | 4;
}) {
  const cols =
    columns === 4 ? "md:grid-cols-4" : columns === 2 ? "md:grid-cols-2" : "md:grid-cols-3";
  return (
    <div className={cn("grid grid-cols-1 gap-5", cols)}>
      {industries.map((i) => (
        <IndustryCard key={i.name} industry={i} />
      ))}
    </div>
  );
}
