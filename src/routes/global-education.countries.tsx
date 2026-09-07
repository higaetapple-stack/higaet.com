import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Section } from "@/components/site/Section";
import { Input } from "@/components/ui/input";
import { Breadcrumbs, breadcrumbJsonLd } from "@/components/site/Breadcrumbs";
import { HubRelatedLinks } from "@/components/site/HubRelatedLinks";
import { listCountriesPublic } from "@/lib/study-abroad.functions";
import { COUNTRIES } from "@/lib/countries-data";

const PATH = "/global-education/countries";

type CountryCard = {
  id: string;
  slug: string;
  name: string;
  flag_emoji: string;
  summary: string | null;
  avg_tuition_usd: number | null;
  primary_language: string | null;
  popular_intakes: string[] | null;
};

/** Static fallback so SSR always renders real destination links (matches sitemap slugs). */
const STATIC_CARDS: CountryCard[] = Object.values(COUNTRIES).map((c) => ({
  id: c.slug,
  slug: c.slug,
  name: c.name,
  flag_emoji: c.flag,
  summary: c.summary,
  avg_tuition_usd: c.avgTuitionUsd,
  primary_language: c.primaryLanguage,
  popular_intakes: c.popularIntakes,
}));

export const Route = createFileRoute("/global-education/countries")({
  loader: async () => {
    try {
      const countries = (await listCountriesPublic()) as CountryCard[];
      return { countries: countries ?? [] };
    } catch {
      return { countries: [] as CountryCard[] };
    }
  },
  head: ({ loaderData }) => {
    const rows: CountryCard[] = loaderData?.countries?.length ? loaderData.countries : STATIC_CARDS;
    const title = "Study Abroad Destinations | Countries for International Students | HIGAET";
    const description =
      "Compare leading study abroad destinations including the USA, UK, Canada, Australia, Germany, Ireland and more. Explore universities, scholarships, admissions and student visa guidance.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: "Top Study-Abroad Destinations | HIGAET" },
        { property: "og:description", content: description },
        { property: "og:url", content: `https://www.higaet.com${PATH}` },
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Study Abroad Destinations",
            url: `https://www.higaet.com${PATH}`,
            description,
            isPartOf: { "@type": "WebSite", name: "HIGAET" },
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Study abroad destinations",
            itemListElement: rows.map((c, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: c.name,
              url: `https://www.higaet.com${PATH}/${c.slug}`,
            })),
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify(
            breadcrumbJsonLd([
              { label: "Home", href: "/" },
              { label: "Global Education Hub", href: "/global-education" },
              { label: "Study Destinations" },
            ]),
          ),
        },
      ],
    };
  },
  component: CountriesPage,
});

function CountriesPage() {
  const loaderData = Route.useLoaderData();
  const [q, setQ] = useState("");
  const query = useQuery({
    queryKey: ["public-countries"],
    queryFn: () => listCountriesPublic() as Promise<CountryCard[]>,
    initialData: loaderData.countries?.length ? loaderData.countries : STATIC_CARDS,
  });
  const all: CountryCard[] = (query.data ?? STATIC_CARDS) as CountryCard[];
  const needle = q.trim().toLowerCase();
  const rows = needle
    ? all.filter((c) => `${c.name} ${c.summary ?? ""}`.toLowerCase().includes(needle))
    : all;

  return (
    <>
      <PageHero
        brand="global"
        eyebrow="Study destinations"
        title="Study Abroad Destinations"
        subtitle="Compare destinations by universities, admissions, scholarship opportunities, tuition guidance, visa information and study pathways."
      />
      <Section className="!pt-6">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Global Education Hub", href: "/global-education" },
            { label: "Study Destinations" },
          ]}
        />
        <div className="relative max-w-md mt-6 mb-2">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <label htmlFor="destination-search" className="sr-only">
            Search study destinations
          </label>
          <Input
            id="destination-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search destinations…"
            className="pl-9"
          />
        </div>
        <p className="text-xs text-muted-foreground mb-6" role="status">
          Showing {rows.length} of {all.length} destinations
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((c) => (
            <Link
              key={c.slug}
              to="/global-education/countries/$slug"
              params={{ slug: c.slug }}
              className="group rounded-2xl ring-1 ring-border bg-card p-5 hover:ring-global/40 transition-all"
              aria-label={`Study in ${c.name} — universities, tuition and visa guidance`}
            >
              <div className="text-3xl mb-2" aria-hidden>
                {c.flag_emoji}
              </div>
              <div className="font-display text-xl text-ink group-hover:text-global">{c.name}</div>
              <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{c.summary}</p>
              <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <dt className="text-muted-foreground">Avg tuition</dt>
                  <dd className="text-ink">
                    ${Number(c.avg_tuition_usd ?? 0).toLocaleString()}/yr
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Language</dt>
                  <dd className="text-ink">{c.primary_language}</dd>
                </div>
              </dl>
              {(c.popular_intakes?.length ?? 0) > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {(c.popular_intakes ?? []).map((t: string) => (
                    <span
                      key={t}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-ink uppercase tracking-wider"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
          {rows.length === 0 && (
            <p className="text-sm text-muted-foreground col-span-full text-center py-12">
              No destinations match “{q}”. Clear the search or{" "}
              <Link to="/global-education/contact" className="text-global underline">
                talk to a counsellor
              </Link>
              .
            </p>
          )}
        </div>
      </Section>

      <Section className="bg-muted/30">
        <span className="text-xs font-semibold uppercase tracking-widest text-global">Compare</span>
        <h2 className="font-display text-3xl md:text-4xl font-medium tracking-tight mt-4 mb-8 max-w-[28ch] text-balance">
          Destinations at a glance.
        </h2>
        <div className="overflow-x-auto rounded-2xl ring-1 ring-border bg-card">
          <table className="w-full text-sm min-w-[640px]">
            <caption className="sr-only">
              Comparison of study abroad destinations by average tuition, intakes and language
            </caption>
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                <th scope="col" className="px-5 py-3 font-medium">
                  Destination
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  Avg tuition / yr
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  Common intakes
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  Language
                </th>
              </tr>
            </thead>
            <tbody>
              {all.map((c) => (
                <tr key={c.slug} className="border-b border-border last:border-0">
                  <th scope="row" className="px-5 py-3 font-medium text-ink text-left">
                    <Link
                      to="/global-education/countries/$slug"
                      params={{ slug: c.slug }}
                      className="hover:text-global"
                    >
                      {c.flag_emoji} {c.name}
                    </Link>
                  </th>
                  <td className="px-5 py-3 text-muted-foreground">
                    ${Number(c.avg_tuition_usd ?? 0).toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {(c.popular_intakes ?? []).join(" · ") || "—"}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{c.primary_language}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Indicative averages for planning. Each{" "}
          <Link
            to="/global-education/countries/$slug"
            params={{ slug: "usa" }}
            className="underline"
          >
            destination guide
          </Link>{" "}
          links verified universities, scholarships and visa guidance.
        </p>
      </Section>

      <Section>
        <HubRelatedLinks
          brand="global"
          eyebrow="Plan further"
          title="From destination to admission."
          ringHoverClass="hover:ring-global/40"
          links={[
            {
              to: "/global-education/universities",
              label: "Find universities",
              body: "Search and compare university profiles in each destination country.",
            },
            {
              to: "/global-education/knowledge-base/universities",
              label: "University guides",
              body: "In-depth guides and profiles for leading universities worldwide.",
            },
            {
              to: "/global-education/scholarships",
              label: "Scholarships",
              body: "Merit and need-based funding across institutions and funding bodies.",
            },
            {
              to: "/global-education/visa-guidance",
              label: "Visa guidance",
              body: "Country-wise visa requirements, timelines, and interview prep.",
            },
            {
              to: "/global-education/admission-process",
              label: "Admission process",
              body: "How shortlisting, applications, offers and visas fit together.",
            },
          ]}
        />
      </Section>
    </>
  );
}
