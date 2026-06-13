import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, GraduationCap, MapPin, Wallet } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Section } from "@/components/site/Section";
import { CTASection } from "@/components/site/CTASection";
import { getCountryPublic } from "@/lib/study-abroad.functions";

export const Route = createFileRoute("/global-education/countries/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `Study in ${params.slug.replace(/-/g, " ")} — HIGAET` },
      { name: "description", content: `Universities, tuition, scholarships, and visa info for studying in ${params.slug}.` },
      { property: "og:url", content: `/global-education/countries/${params.slug}` },
    ],
    links: [{ rel: "canonical", href: `/global-education/countries/${params.slug}` }],
  }),
  component: CountryDetail,
  notFoundComponent: () => <div className="p-10">Country not found.</div>,
  errorComponent: ({ error }) => <div className="p-10">Error: {error.message}</div>,
});

function CountryDetail() {
  const { slug } = Route.useParams();
  const fetcher = useServerFn(getCountryPublic);
  const q = useQuery({ queryKey: ["public-country", slug], queryFn: () => fetcher({ data: { slug } }) });

  if (q.isLoading) return <div className="p-10 text-sm text-muted-foreground">Loading…</div>;
  if (!q.data) throw notFound();
  const { country, universities, scholarships } = q.data;

  return (
    <>
      <PageHero
        brand="global"
        eyebrow="Study destination"
        title={`${country.flag_emoji ?? ""} Study in ${country.name}`}
        subtitle={country.summary ?? ""}
      >
        <Link to="/global-education/countries" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-ink"><ArrowLeft className="size-3" /> All destinations</Link>
      </PageHero>
      <Section>
        <div className="grid lg:grid-cols-3 gap-6">
          <Fact label="Avg tuition / year" value={`$${Number(country.avg_tuition_usd ?? 0).toLocaleString()}`} icon={<Wallet className="size-4" />} />
          <Fact label="Primary language" value={country.primary_language ?? "—"} icon={<GraduationCap className="size-4" />} />
          <Fact label="Currency" value={country.currency ?? "—"} icon={<MapPin className="size-4" />} />
        </div>
        {country.description && <p className="mt-8 text-ink/90 leading-relaxed whitespace-pre-line max-w-3xl">{country.description}</p>}
      </Section>

      <Section className="bg-muted/30">
        <h2 className="font-display text-2xl text-ink mb-6">Top universities in {country.name}</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {universities.map((u: any) => (
            <Link key={u.id} to="/global-education/universities/$slug" params={{ slug: u.slug }} className="rounded-2xl ring-1 ring-border bg-card p-5 hover:ring-global/40">
              <div className="font-medium text-ink">{u.name}</div>
              <div className="text-xs text-muted-foreground mt-1">{u.city}</div>
              <div className="mt-3 flex gap-3 text-xs">
                {u.world_ranking && <span className="text-global">#{u.world_ranking} global</span>}
                {u.avg_tuition_usd && <span className="text-muted-foreground">${Number(u.avg_tuition_usd).toLocaleString()}/yr</span>}
              </div>
            </Link>
          ))}
          {universities.length === 0 && <p className="text-sm text-muted-foreground">No universities listed yet.</p>}
        </div>
      </Section>

      {scholarships.length > 0 && (
        <Section>
          <h2 className="font-display text-2xl text-ink mb-6">Scholarships</h2>
          <ul className="divide-y divide-border ring-1 ring-border rounded-2xl bg-card">
            {scholarships.map((s: any) => (
              <li key={s.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="text-ink font-medium">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{s.coverage}</div>
                </div>
                <div className="text-right text-xs">
                  {s.amount_usd && <div className="text-ink">${Number(s.amount_usd).toLocaleString()}</div>}
                  {s.deadline && <div className="text-muted-foreground">Apply by {s.deadline}</div>}
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <CTASection
        title={`Plan your application to ${country.name}.`}
        body="Get a free consultation with a HIGAET counsellor to shortlist universities and map your timeline."
        primaryHref="/global-education/contact"
        primaryLabel="Book consultation"
        secondaryHref="/global-education/universities"
        secondaryLabel="Browse universities"
      />
    </>
  );
}

function Fact({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl ring-1 ring-border bg-card p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">{icon}{label}</div>
      <div className="mt-2 font-display text-xl text-ink">{value}</div>
    </div>
  );
}
