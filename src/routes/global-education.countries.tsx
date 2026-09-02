import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { PageHero } from "@/components/site/PageHero";
import { Section } from "@/components/site/Section";
import { listCountriesPublic } from "@/lib/study-abroad.functions";
import { useMatch } from "@tanstack/react-router";
import { COUNTRIES, KB_COUNTRIES, getCountryData } from "@/lib/countries-data";
import { HubRelatedLinks } from "@/components/site/HubRelatedLinks";

export const Route = createFileRoute("/global-education/countries")({
  head: () => ({
    meta: [
      { title: "Study Destinations — HIGAET Global Education Hub" },
      { name: "description", content: "Compare top study-abroad destinations: USA, Canada, UK, Australia, Germany, Ireland, New Zealand, Singapore." },
      { property: "og:title", content: "Top Study-Abroad Destinations | HIGAET" },
      { property: "og:url", content: "https://www.higaet.com/global-education/countries" },
    ],
  }),
  component: CountriesPage,
});

function CountriesPage() {
  const fetcher = useServerFn(listCountriesPublic);
  const q = useQuery({ queryKey: ["public-countries"], queryFn: () => fetcher() });
  
  // Check if we're at the exact index route (no child route active)
  const indexMatch = useMatch({ path: "/global-education/countries" });
  const isExactIndex = indexMatch && !indexMatch.pathname.includes("/countries/");

  return (
    <>
      <PageHero
        brand="global"
        eyebrow="Study destinations"
        title="Pick the country that fits your goals."
        subtitle="Side-by-side overviews of tuition, intakes, language, and visa highlights across our partner countries."
      />
      <Section>
        {/* Render the country grid only at the exact index route */}
        {isExactIndex && (
          <div className="animate-fade-in">
            <p className="text-sm text-muted-foreground mb-6">Loading destinations…</p>
            <CountriesGrid />
          </div>
        )}
        {/* Render child route (detail page) in the Outlet */}
        <Outlet />
        <HubRelatedLinks
          brand="global"
          eyebrow="Plan further"
          title="From destination to admission."
          ringHoverClass="hover:ring-global/40"
          links={[
            {
              to: "/global-education/knowledge-base/universities",
              label: "Universities",
              body: "Browse verified university profiles in each destination country.",
            },
            {
              to: "/global-education/visa-guidance",
              label: "Visa guidance",
              body: "Country-wise visa requirements, timelines, and interview prep.",
            },
            {
              to: "/global-education/scholarships",
              label: "Scholarships",
              body: "Merit and need-based funding across partner institutions and bodies.",
            },
          ]}
        />
      </Section>
    </>
  );
}

function CountriesGrid() {
  const fetcher = useServerFn(listCountriesPublic);
  const q = useQuery({ queryKey: ["public-countries"], queryFn: () => fetcher() });

  if (q.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading destinations…</p>;
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {(q.data ?? []).map((c: any) => (
        <Link
          key={c.id}
          to="/global-education/countries/$slug"
          params={{ slug: c.slug }}
          className="group rounded-2xl ring-1 ring-border bg-card p-5 hover:ring-global/40 transition-all"
        >
          <div className="text-3xl mb-2">{c.flag_emoji}</div>
          <div className="font-display text-xl text-ink group-hover:text-global">{c.name}</div>
          <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{c.summary}</p>
          <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <div><dt className="text-muted-foreground">Avg tuition</dt><dd className="text-ink">${Number(c.avg_tuition_usd ?? 0).toLocaleString()}/yr</dd></div>
            <div><dt className="text-muted-foreground">Language</dt><dd className="text-ink">{c.primary_language}</dd></div>
          </dl>
          {c.popular_intakes?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {c.popular_intakes.map((i: string) => (
                <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-ink uppercase tracking-wider">{i}</span>
              ))}
            </div>
          )}
        </Link>
      ))}
    </div>
  );
}
