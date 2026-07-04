import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { PageHero } from "@/components/site/PageHero";
import { Section } from "@/components/site/Section";
import { listCountriesPublic } from "@/lib/study-abroad.functions";

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

  return (
    <>
      <PageHero
        brand="global"
        eyebrow="Study destinations"
        title="Pick the country that fits your goals."
        subtitle="Side-by-side overviews of tuition, intakes, language, and visa highlights across our partner countries."
      />
      <Section>
        {q.isLoading && <p className="text-sm text-muted-foreground">Loading destinations…</p>}
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
      </Section>
    </>
  );
}
