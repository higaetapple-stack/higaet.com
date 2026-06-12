import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Section } from "./Section";

export function CTASection({
  eyebrow,
  title,
  body,
  primaryHref = "/contact",
  primaryLabel = "Schedule Consultation",
  secondaryHref,
  secondaryLabel,
}: {
  eyebrow?: string;
  title: string;
  body: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <Section>
      <div className="bg-ink p-12 md:p-16 rounded-[24px] text-surface relative overflow-hidden">
        <div className="relative z-10 max-w-[52ch]">
          {eyebrow && (
            <span className="text-xs font-semibold uppercase tracking-widest text-surface/60 mb-4 block">
              {eyebrow}
            </span>
          )}
          <h2 className="font-display text-3xl md:text-4xl font-medium mb-6 leading-tight text-balance">
            {title}
          </h2>
          <p className="text-surface/70 mb-8 text-pretty">{body}</p>
          <div className="flex flex-wrap gap-3">
            <Link
              to={primaryHref}
              className="bg-surface text-ink text-sm font-medium py-2.5 pl-3 pr-4 inline-flex items-center gap-2 rounded-md hover:bg-surface/90 transition-colors"
            >
              {primaryLabel}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            {secondaryHref && secondaryLabel && (
              <Link
                to={secondaryHref}
                className="ring-1 ring-surface/30 text-surface text-sm font-medium py-2.5 px-4 rounded-md hover:bg-surface/10 transition-colors"
              >
                {secondaryLabel}
              </Link>
            )}
          </div>
        </div>
      </div>
    </Section>
  );
}
