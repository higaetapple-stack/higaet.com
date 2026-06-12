import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Section({
  children,
  className,
  containerClassName,
  id,
  ariaLabel,
}: {
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  id?: string;
  ariaLabel?: string;
}) {
  return (
    <section id={id} aria-label={ariaLabel} className={cn("py-20 md:py-24 px-6", className)}>
      <div className={cn("max-w-7xl mx-auto", containerClassName)}>{children}</div>
    </section>
  );
}

export function Eyebrow({ children, brand }: { children: ReactNode; brand?: "academy" | "global" | "tech" }) {
  const color =
    brand === "academy"
      ? "text-academy"
      : brand === "global"
        ? "text-global"
        : brand === "tech"
          ? "text-tech"
          : "text-ink";
  return (
    <span className={cn("text-xs font-semibold uppercase tracking-widest", color)}>{children}</span>
  );
}
