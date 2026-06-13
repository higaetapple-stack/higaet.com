import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Breadcrumbs, type Crumb } from "./Breadcrumbs";
import { cn } from "@/lib/utils";

type Brand = "academy" | "global" | "tech";

export function ServiceHero({
  eyebrow,
  title,
  subtitle,
  brand = "tech",
  breadcrumbs,
  primaryHref,
  primaryLabel = "Talk to an engineer",
  secondaryHref,
  secondaryLabel,
  highlights,
  className,
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  brand?: Brand;
  breadcrumbs?: Crumb[];
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  highlights?: string[];
  className?: string;
  children?: ReactNode;
}) {
  const eyebrowColor =
    brand === "academy" ? "text-academy" : brand === "global" ? "text-global" : "text-tech";

  return (
    <header
      className={cn(
        "relative isolate overflow-hidden border-b border-border bg-[var(--gradient-surface)] px-6 py-16 md:py-24",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.04] [background-image:linear-gradient(to_right,oklch(0.18_0.01_270/.6)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.18_0.01_270/.6)_1px,transparent_1px)] [background-size:48px_48px]"
      />
      <div className="max-w-7xl mx-auto">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumbs items={breadcrumbs} className="mb-6" />
        )}
        <div className="grid gap-12 lg:grid-cols-[1.4fr_0.9fr] lg:items-end">
          <div className="max-w-[56ch]">
            {eyebrow && (
              <span
                className={cn(
                  "text-xs font-semibold uppercase tracking-widest mb-5 block",
                  eyebrowColor,
                )}
              >
                {eyebrow}
              </span>
            )}
            <h1 className="font-display text-4xl md:text-6xl font-medium tracking-tight leading-[1.04] text-balance text-ink">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-6 text-lg md:text-xl text-muted-foreground leading-relaxed text-pretty max-w-[52ch]">
                {subtitle}
              </p>
            )}

            {(primaryHref || secondaryHref) && (
              <div className="mt-8 flex flex-wrap gap-3">
                {primaryHref && (
                  <Link
                    to={primaryHref}
                    className="bg-ink text-surface text-sm font-medium px-4 py-2.5 rounded-md inline-flex items-center gap-2 hover:bg-ink/90 transition-colors"
                  >
                    {primaryLabel}
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                )}
                {secondaryHref && secondaryLabel && (
                  <Link
                    to={secondaryHref}
                    className="ring-1 ring-border text-ink text-sm font-medium px-4 py-2.5 rounded-md hover:bg-muted transition-colors"
                  >
                    {secondaryLabel}
                  </Link>
                )}
              </div>
            )}
            {children && <div className="mt-8">{children}</div>}
          </div>

          {highlights && highlights.length > 0 && (
            <ul className="grid gap-3 rounded-2xl bg-card/80 p-6 ring-1 ring-border [box-shadow:var(--shadow-card)] backdrop-blur">
              {highlights.map((h) => (
                <li key={h} className="flex gap-3 text-sm text-ink leading-relaxed">
                  <span
                    aria-hidden
                    className={cn(
                      "mt-2 size-1.5 shrink-0 rounded-full",
                      brand === "academy"
                        ? "bg-academy"
                        : brand === "global"
                          ? "bg-global"
                          : "bg-tech",
                    )}
                  />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </header>
  );
}
