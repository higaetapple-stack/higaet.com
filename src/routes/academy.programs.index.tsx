import { createFileRoute, Link } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { ArrowRight } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Section } from "@/components/site/Section";
import { CTASection } from "@/components/site/CTASection";
import { PROGRAMS, CATEGORY_LABELS, type ProgramCategory } from "@/lib/academy-programs";
import { cn } from "@/lib/utils";

const CATEGORY_KEYS = ["all", "ai", "data", "cloud", "cyber", "product", "engineering"] as const;

const programSearch = z.object({
  category: fallback(z.enum(CATEGORY_KEYS), "all").default("all"),
});

export const Route = createFileRoute("/academy/programs/")({
  validateSearch: zodValidator(programSearch),
  head: () => ({
    meta: [
      { title: "Programs — HIGAET Academy" },
      { name: "description", content: "Flagship HIGAET Academy programs in Generative AI, Data Science, Cloud, Cybersecurity, and AI Product Management." },
      { property: "og:title", content: "Programs — HIGAET Academy" },
      { property: "og:description", content: "Industry-aligned career tracks with placement support." },
      { property: "og:url", content: "https://www.higaet.com/academy/programs" },
    ],
  }),
  component: ProgramsIndex,
});

function ProgramsIndex() {
  const { category } = Route.useSearch();
  const filtered = category === "all" ? PROGRAMS : PROGRAMS.filter((p) => p.category === (category as ProgramCategory));

  return (
    <>
      <PageHero
        brand="academy"
        eyebrow="Academy · Programs"
        title="Career tracks built for the AI-native workplace."
        subtitle="Six flagship programs across Generative AI, Data, Cloud, Cybersecurity, and AI Product Management — taught by practitioners, evaluated by hiring partners."
      />

      <Section className="!pt-0">
        <div className="mb-10 flex flex-wrap gap-2">
          {CATEGORY_KEYS.map((key) => {
            const label = key === "all" ? "All programs" : CATEGORY_LABELS[key as ProgramCategory];
            const active = category === key;
            return (
              <Link
                key={key}
                to="/academy/programs"
                search={{ category: key }}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-xs font-medium uppercase tracking-wider transition-colors",
                  active
                    ? "border-academy bg-academy/10 text-academy"
                    : "border-border text-muted-foreground hover:border-foreground/30 hover:text-ink",
                )}
              >
                {label}
              </Link>
            );
          })}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <Link
              key={p.slug}
              to="/academy/programs/$slug"
              params={{ slug: p.slug }}
              className="group flex flex-col rounded-xl bg-card p-6 ring-1 ring-border transition hover:ring-foreground/20"
            >
              <span className="text-[10px] font-bold uppercase tracking-widest text-academy">
                {CATEGORY_LABELS[p.category]} · {p.level}
              </span>
              <h2 className="mt-3 font-display text-xl font-medium text-ink">{p.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.tagline}</p>

              <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-muted-foreground">
                <div><dt className="text-ink/60">Duration</dt><dd className="text-ink">{p.duration}</dd></div>
                <div><dt className="text-ink/60">Format</dt><dd className="text-ink">{p.format}</dd></div>
                <div><dt className="text-ink/60">Fee</dt><dd className="text-ink">{p.feeINR}</dd></div>
                <div><dt className="text-ink/60">EMI from</dt><dd className="text-ink">{p.emiFromINR}</dd></div>
              </dl>

              <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-academy group-hover:translate-x-1 transition-transform">
                View program <ArrowRight className="size-4" aria-hidden />
              </span>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground">No programs in this category yet.</p>
        )}
      </Section>

      <CTASection
        title="Not sure which program fits?"
        body="Speak with a HIGAET advisor for a 20-minute fit assessment based on your background and goals."
        primaryHref="/academy/contact"
        primaryLabel="Book an advisor call"
        secondaryHref="/academy/scholarship"
        secondaryLabel="Explore scholarships"
      />
    </>
  );
}
