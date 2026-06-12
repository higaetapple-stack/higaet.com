import { Link } from "@tanstack/react-router";
import { ArrowRight, type LucideProps } from "lucide-react";
import type { ComponentType } from "react";
import { cn } from "@/lib/utils";

type Brand = "academy" | "global" | "tech";

const BRAND_STYLES: Record<Brand, { text: string; bg: string; label: string }> = {
  academy: { text: "text-academy", bg: "bg-academy/10", label: "Division 01" },
  global: { text: "text-global", bg: "bg-global/10", label: "Division 02" },
  tech: { text: "text-tech", bg: "bg-tech/10", label: "Division 03" },
};

export function DivisionCard({
  brand,
  title,
  body,
  href,
  ctaLabel,
  icon: Icon,
}: {
  brand: Brand;
  title: string;
  body: string;
  href: string;
  ctaLabel: string;
  icon: ComponentType<LucideProps>;
}) {
  const s = BRAND_STYLES[brand];
  return (
    <Link
      to={href}
      className="bg-surface p-8 flex flex-col justify-between min-h-[400px] group transition-colors hover:bg-muted/40"
    >
      <div>
        <div className={cn("size-10 rounded-lg flex items-center justify-center mb-6", s.bg)}>
          <Icon className={cn("size-5", s.text)} aria-hidden />
        </div>
        <span className={cn("text-[10px] font-bold uppercase tracking-widest mb-2 block", s.text)}>
          {s.label}
        </span>
        <h3 className="font-display text-2xl font-medium mb-3 text-ink">{title}</h3>
        <p className="text-sm text-muted-foreground leading-normal max-w-[32ch]">{body}</p>
      </div>
      <span
        className={cn(
          "mt-6 text-sm font-medium inline-flex items-center gap-1.5 group-hover:translate-x-1 transition-transform",
          s.text,
        )}
      >
        {ctaLabel}
        <ArrowRight className="size-4" aria-hidden />
      </span>
    </Link>
  );
}
