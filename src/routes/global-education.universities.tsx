import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Section } from "@/components/site/Section";
import { Input } from "@/components/ui/input";
import { Breadcrumbs, breadcrumbJsonLd } from "@/components/site/Breadcrumbs";
import { listUniversitiesPublic, listCountriesPublic } from "@/lib/study-abroad.functions";
import { buildServiceJsonLdScripts } from "@/lib/seo/service-schema";
import { SERVICE_SCHEMAS } from "@/lib/seo/global-education-services";

type UniRow = {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  world_ranking: number | null;
  avg_tuition_usd: number | null;
  featured: boolean | null;
  countries: { slug: string; name: string; flag_emoji: string } | null;
};

type CountryRow = {
  id: string;
  slug: string;
  name: string;
  flag_emoji: string;
};

const TITLE = "Find International Universities | Study Abroad University Finder | HIGAET";
const DESCRIPTION =
  "Search and explore international universities by country, study level and subject. Discover university profiles, programs, admissions information and scholarship opportunities.";

export const Route = createFileRoute("/global-education/universities")({
  loader: async () => {
    try {
      const [unis, countries] = await Promise.all([
        listUniversitiesPublic({ data: {} }) as Promise<UniRow[]>,
        listCountriesPublic() as Promise<CountryRow[]>,
      ]);
      return { unis: unis ?? [], countries: countries ?? [] };
    } catch {
      return { unis: [] as UniRow[], countries: [] as CountryRow[] };
    }
  },
  head: ({ loaderData }) => {
    const scripts = buildServiceJsonLdScripts(SERVICE_SCHEMAS["universities"]);
    scripts.push({
      type: "application/ld+json",
      children: JSON.stringify(
        breadcrumbJsonLd([
          { label: "Home", href: "/" },
          { label: "Global Education Hub", href: "/global-education" },
          { label: "Find Universities" },
        ]),
      ),
    });
    if (loaderData?.unis?.length) {
      scripts.push({
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "International universities",
          itemListElement: loaderData.unis.slice(0, 50).map((u, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: u.name,
            url: `https://www.higaet.com/global-education/universities/${u.slug}`,
          })),
        }),
      });
    }
    return {
      meta: [
        { title: TITLE },
        { name: "description", content: DESCRIPTION },
        { property: "og:title", content: TITLE },
        { property: "og:description", content: DESCRIPTION },
        {
          property: "og:url",
          content: "https://www.higaet.com/global-education/universities",
        },
      ],
      scripts,
    };
  },
  component: UniversitiesPage,
});

function UniversitiesPage() {
  const loaderData = Route.useLoaderData();
  const [country, setCountry] = useState<string>("");
  const [q, setQ] = useState<string>("");
  // Unfiltered SSR snapshot (crawlable); filtered views fetch client-side.
  const unfiltered = country === "" && q.trim() === "";
  const unis = useQuery({
    queryKey: ["public-unis", country, q],
    queryFn: () =>
      listUniversitiesPublic({
        data: { country: country || undefined, q: q || undefined },
      }) as Promise<UniRow[]>,
    initialData: unfiltered ? (loaderData.unis as UniRow[]) : undefined,
  });
  const countries = useQuery({
    queryKey: ["public-countries"],
    queryFn: () => listCountriesPublic() as Promise<CountryRow[]>,
    initialData: loaderData.countries?.length ? (loaderData.countries as CountryRow[]) : undefined,
  });
  const rows: UniRow[] = ((unis.data ?? loaderData.unis ?? []) as UniRow[]).filter((u) =>
    unfiltered
      ? true
      : (country === "" || u.countries?.slug === country) &&
        (q.trim() === "" || u.name.toLowerCase().includes(q.trim().toLowerCase())),
  );

  return (
    <>
      <PageHero
        brand="global"
        eyebrow="Universities"
        title="Find the Right University for Your Global Future"
        subtitle="Search university profiles by destination. Compare programs, tuition and intakes — then get a free counsellor shortlist."
      />
      <Section className="!pt-6">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Global Education Hub", href: "/global-education" },
            { label: "Find Universities" },
          ]}
        />
        <div className="flex flex-wrap gap-3 mt-6 mb-2">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <label htmlFor="university-search" className="sr-only">
              Search universities by name
            </label>
            <Input
              id="university-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search universities…"
              className="pl-9"
            />
          </div>
          <label htmlFor="university-country" className="sr-only">
            Filter universities by destination country
          </label>
          <select
            id="university-country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="h-10 rounded-md ring-1 ring-border px-3 text-sm bg-background"
          >
            <option value="">All countries</option>
            {((countries.data ?? loaderData.countries ?? []) as CountryRow[]).map((c) => (
              <option key={c.id} value={c.slug}>
                {c.flag_emoji} {c.name}
              </option>
            ))}
          </select>
        </div>
        <p className="text-xs text-muted-foreground mb-6" role="status">
          Showing {rows.length} universit{rows.length === 1 ? "y" : "ies"}
          {country || q ? " matching your filters" : " worldwide"}
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((u) => (
            <Link
              key={u.id}
              to="/global-education/universities/$slug"
              params={{ slug: u.slug }}
              className="group rounded-2xl ring-1 ring-border bg-card p-5 hover:ring-global/40"
              aria-label={`${u.name} — explore university profile`}
            >
              <div className="text-xs text-muted-foreground">
                {u.countries?.flag_emoji} {u.countries?.name} · {u.city}
              </div>
              <div className="mt-2 font-display text-lg text-ink group-hover:text-global">
                {u.name}
              </div>
              <div className="mt-3 flex gap-3 text-xs">
                {u.world_ranking && (
                  <span className="text-global font-medium">#{u.world_ranking} world</span>
                )}
                {u.avg_tuition_usd && (
                  <span className="text-muted-foreground">
                    ${Number(u.avg_tuition_usd).toLocaleString()}/yr
                  </span>
                )}
                {u.featured && (
                  <span className="bg-global/10 text-global px-1.5 rounded">Featured</span>
                )}
              </div>
              <span className="mt-3 inline-block text-xs font-medium text-global">
                Explore University Profile →
              </span>
            </Link>
          ))}
          {rows.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-sm text-muted-foreground">
                No universities match these filters. Clear filters or explore another destination.
              </p>
              <button
                type="button"
                onClick={() => {
                  setCountry("");
                  setQ("");
                }}
                className="mt-4 text-sm font-medium text-global underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl ring-1 ring-border bg-card p-5">
          <p className="text-sm text-muted-foreground max-w-[52ch]">
            Want a counsellor-reviewed shortlist? Prefer in-depth reads? Browse our{" "}
            <Link
              to="/global-education/knowledge-base/universities"
              className="text-global underline"
            >
              University Guides &amp; Profiles
            </Link>
            .
          </p>
          <Link
            to="/global-education/contact"
            className="bg-global text-white text-sm font-medium px-4 py-2.5 rounded-md hover:opacity-90 transition-opacity"
          >
            Get Your Free Shortlist
          </Link>
        </div>
      </Section>
    </>
  );
}
