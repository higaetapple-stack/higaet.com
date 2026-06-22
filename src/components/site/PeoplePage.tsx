import { Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { PageHero } from "@/components/site/PageHero";
import { Section } from "@/components/site/Section";
import { CTASection } from "@/components/site/CTASection";
import type { Person } from "@/content/people";

export function PeoplePage({
  eyebrow,
  title,
  subtitle,
  intro,
  people,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  intro: string;
  people: Person[];
}) {
  return (
    <SiteShell>
      <PageHero eyebrow={eyebrow} title={title} subtitle={subtitle} />
      <Section>
        <p className="max-w-3xl text-ink/85 leading-relaxed">{intro}</p>
        <ul className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {people.map((p) => (
            <li key={p.slug} className="rounded-2xl bg-card p-6 ring-1 ring-border">
              <h3 className="font-display text-lg font-medium text-ink">{p.name}</h3>
              <p className="text-xs uppercase tracking-widest text-academy mt-1">{p.jobTitle}</p>
              <p className="text-xs text-muted-foreground mt-1">{p.affiliation}</p>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{p.bio}</p>
            </li>
          ))}
        </ul>
        <p className="mt-10 text-sm text-muted-foreground">
          Learn more about{" "}
          <Link to="/about-higaet" className="text-academy underline">HIGAET</Link>.
        </p>
      </Section>
      <CTASection title="Work with HIGAET." body="Connect with our teams across Academy, Global Education Hub, and Technologies." />
    </SiteShell>
  );
}
