import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Section, Eyebrow } from "./Section";
import { cn } from "@/lib/utils";

export type HubRelatedLink = {
  to: string;
  label: string;
  body: string;
};

/**
 * Reusable hub→child contextual link strip (Gate D8 internal linking).
 * Renders real, user-facing cards to existing child routes — crawlers,
 * users, and AI systems get explicit parent/child discovery without
 * relying on nav/footer or client-side widgets the audit cannot see.
 */
export function HubRelatedLinks({
  brand,
  eyebrow,
  title,
  links,
  ringHoverClass = "hover:ring-foreground/20",
}: {
  brand?: "academy" | "global" | "tech";
  eyebrow: string;
  title: string;
  links: HubRelatedLink[];
  ringHoverClass?: string;
}) {
  return (
    <Section className="bg-muted/30 !py-16">
      <Eyebrow brand={brand}>{eyebrow}</Eyebrow>
      <h2 className="font-display text-2xl md:text-3xl font-medium tracking-tight mt-4 mb-10 max-w-[32ch] text-balance">
        {title}
      </h2>
      <nav aria-label={eyebrow} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className={cn(
              "group rounded-xl bg-card p-6 ring-1 ring-border transition",
              ringHoverClass,
            )}
          >
            <span className="font-display text-lg font-medium text-ink">{l.label}</span>
            <span className="block text-sm text-muted-foreground mt-1 leading-relaxed">
              {l.body}
            </span>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-ink/70 group-hover:text-ink group-hover:translate-x-0.5 transition-all">
              Explore <ArrowRight className="size-4" aria-hidden />
            </span>
          </Link>
        ))}
      </nav>
    </Section>
  );
}
