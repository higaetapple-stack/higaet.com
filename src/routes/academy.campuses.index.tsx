import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, MapPin } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Section } from "@/components/site/Section";
import { CTASection } from "@/components/site/CTASection";
import { HubLongform } from "@/components/site/HubLongform";
import { CAMPUSES } from "@/lib/academy-programs";

export const Route = createFileRoute("/academy/campuses/")({
  head: () => ({
    meta: [
      { title: "Campuses — HIGAET Academy" },
      { name: "description", content: "Explore HIGAET on-campus industry diplomas — Bengaluru and Hyderabad." },
      { property: "og:title", content: "HIGAET Campuses" },
      { property: "og:description", content: "On-campus industry diplomas at HIGAET Bengaluru and Hyderabad." },
      { property: "og:url", content: "https://www.higaet.com/academy/campuses" },
    ],
  }),
  component: CampusesIndex,
});

function CampusesIndex() {
  return (
    <>
      <PageHero
        brand="academy"
        eyebrow="Academy · Campuses"
        title="On-campus industry diplomas."
        subtitle="HIGAET campus programs combine a residential cohort, GPU-equipped labs, and an embedded industry capstone — designed for graduates who want an immersive year."
      />

      <Section className="!pt-0">
        <div className="grid gap-6 md:grid-cols-2">
          {CAMPUSES.map((c) => (
            <Link
              key={c.slug}
              to="/academy/campuses/$slug"
              params={{ slug: c.slug }}
              className="group rounded-xl bg-card p-8 ring-1 ring-border transition hover:ring-foreground/20"
            >
              <span className="text-[10px] font-bold uppercase tracking-widest text-academy">{c.partnerType}</span>
              <h2 className="mt-3 font-display text-2xl font-medium text-ink">{c.name}</h2>
              <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="size-3.5" aria-hidden /> {c.city}
              </p>
              <p className="mt-5 text-sm leading-relaxed text-ink">{c.degree}</p>
              <p className="mt-2 text-xs text-muted-foreground">{c.durationYears} year · {c.scholarship}</p>
              <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-academy group-hover:translate-x-1 transition-transform">
                Explore campus <ArrowRight className="size-4" aria-hidden />
              </span>
            </Link>
          ))}
        </div>
      </Section>

      <CTASection
        title="Curious about life on a HIGAET campus?"
        body="Book a guided campus visit or a virtual tour — meet the faculty, see the labs, and sit in on a live class."
        primaryHref="/academy/contact"
        primaryLabel="Book a campus visit"
      />
      <HubLongform clusterId="academy-campuses-formats" />
    </>
  );
}
