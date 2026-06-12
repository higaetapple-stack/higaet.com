import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHero({
  eyebrow,
  title,
  subtitle,
  brand,
  children,
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  brand?: "academy" | "global" | "tech";
  children?: ReactNode;
  className?: string;
}) {
  const eyebrowColor =
    brand === "academy"
      ? "text-academy"
      : brand === "global"
        ? "text-global"
        : brand === "tech"
          ? "text-tech"
          : "text-ink";
  return (
    <header className={cn("py-20 md:py-28 px-6", className)}>
      <div className="max-w-7xl mx-auto">
        <div className="max-w-[52ch]">
          {eyebrow && (
            <span className={cn("text-xs font-semibold uppercase tracking-widest mb-5 block", eyebrowColor)}>
              {eyebrow}
            </span>
          )}
          <h1 className="font-display text-4xl md:text-6xl font-medium tracking-tight leading-[1.05] text-balance mb-6 text-ink">
            {title}
          </h1>
          {subtitle && (
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed text-pretty max-w-[44ch]">
              {subtitle}
            </p>
          )}
          {children && <div className="mt-8">{children}</div>}
        </div>
      </div>
    </header>
  );
}
