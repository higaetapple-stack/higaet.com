import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ExternalLink, Search } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Section } from "@/components/site/Section";
import { Input } from "@/components/ui/input";
import { Breadcrumbs, breadcrumbJsonLd } from "@/components/site/Breadcrumbs";
import { listScholarshipsPublic } from "@/lib/study-abroad.functions";
import { buildServiceJsonLdScripts } from "@/lib/seo/service-schema";
import { SERVICE_SCHEMAS } from "@/lib/seo/global-education-services";

type ScholarshipRow = {
  id: string;
  slug: string;
  name: string;
  amount_usd: number | null;
  coverage: string | null;
  deadline: string | null;
  eligibility: string | null;
  description: string | null;
  apply_url: string | null;
  countries: { slug: string; name: string; flag_emoji: string } | null;
  universities: { slug: string; name: string } | null;
};

const TITLE = "Study Abroad Scholarships | International Student Funding | HIGAET";
const DESCRIPTION =
  "Explore study abroad scholarships for international students. Find university, government, merit-based and need-based funding opportunities by country and study level.";

export const Route = createFileRoute("/global-education/scholarships")({
  loader: async () => {
    try {
      const items = (await listScholarshipsPublic()) as ScholarshipRow[];
      return { items: items ?? [] };
    } catch {
      return { items: [] as ScholarshipRow[] };
    }
  },
  head: ({ loaderData }) => {
    const scripts = buildServiceJsonLdScripts(SERVICE_SCHEMAS["scholarships"]);
    scripts.push({
      type: "application/ld+json",
      children: JSON.stringify(
        breadcrumbJsonLd([
          { label: "Home", href: "/" },
          { label: "Global Education Hub", href: "/global-education" },
          { label: "Scholarships" },
        ]),
      ),
    });
    if (loaderData?.items?.length) {
      scripts.push({
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Study abroad scholarships",
          itemListElement: loaderData.items.slice(0, 50).map((s, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: s.name,
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
          content: "https://www.higaet.com/global-education/scholarships",
        },
      ],
      scripts,
    };
  },
  component: ScholarshipsPage,
});

function ScholarshipsPage() {
  const loaderData = Route.useLoaderData();
  const [country, setCountry] = useState("");
  const [q, setQ] = useState("");
  const query = useQuery({
    queryKey: ["public-scholarships"],
    queryFn: () => listScholarshipsPublic() as Promise<ScholarshipRow[]>,
    initialData: loaderData.items as ScholarshipRow[],
  });
  const all: ScholarshipRow[] = (query.data ?? []) as ScholarshipRow[];
  const destinations = Array.from(
    new Map(all.filter((s) => s.countries).map((s) => [s.countries!.slug, s.countries!])).values(),
  );
  const needle = q.trim().toLowerCase();
  const rows = all.filter(
    (s) =>
      (country === "" || s.countries?.slug === country) &&
      (needle === "" ||
        `${s.name} ${s.description ?? ""} ${s.eligibility ?? ""}`.toLowerCase().includes(needle)),
  );

  return (
    <>
      <PageHero
        brand="global"
        eyebrow="Scholarships"
        title="Study Abroad Scholarships"
        subtitle="Funding routes that reduce your cost. Filter by destination, check eligibility, and apply — our counsellors help strengthen each application."
      />
      <Section className="!pt-6">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Global Education Hub", href: "/global-education" },
            { label: "Scholarships" },
          ]}
        />
        <div className="flex flex-wrap gap-3 mt-6 mb-2">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <label htmlFor="scholarship-search" className="sr-only">
              Search scholarships by name or keyword
            </label>
            <Input
              id="scholarship-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search scholarships…"
              className="pl-9"
            />
          </div>
          <label htmlFor="scholarship-country" className="sr-only">
            Filter scholarships by destination country
          </label>
          <select
            id="scholarship-country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="h-10 rounded-md ring-1 ring-border px-3 text-sm bg-background"
          >
            <option value="">All destinations</option>
            {destinations.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.flag_emoji} {c.name}
              </option>
            ))}
          </select>
        </div>
        <p className="text-xs text-muted-foreground mb-6" role="status">
          Showing {rows.length} of {all.length} funding opportunities
        </p>
        <ul className="divide-y divide-border ring-1 ring-border rounded-2xl bg-card">
          {rows.map((s) => (
            <li key={s.id} className="p-5 flex items-start gap-4">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-ink font-medium">{s.name}</span>
                  {s.countries && (
                    <Link
                      to="/global-education/countries/$slug"
                      params={{ slug: s.countries.slug }}
                      className="text-xs text-global"
                      aria-label={`Scholarships in ${s.countries.name}`}
                    >
                      {s.countries.flag_emoji} {s.countries.name}
                    </Link>
                  )}
                  {s.universities && (
                    <span className="text-xs text-muted-foreground">· {s.universities.name}</span>
                  )}
                </div>
                {s.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{s.description}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {s.coverage && <span>Coverage: {s.coverage}</span>}
                  {s.eligibility && (
                    <span className="line-clamp-1">Eligibility: {s.eligibility}</span>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                {s.amount_usd ? (
                  <div className="text-ink font-medium">
                    ${Number(s.amount_usd).toLocaleString()}
                  </div>
                ) : null}
                {s.deadline && (
                  <div className="text-xs text-muted-foreground">Apply by {s.deadline}</div>
                )}
                {s.apply_url && (
                  <a
                    href={s.apply_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs text-global"
                    aria-label={`Apply for ${s.name} (opens official source in a new tab)`}
                  >
                    Official source <ExternalLink className="size-3" />
                  </a>
                )}
              </div>
            </li>
          ))}
          {rows.length === 0 && (
            <li className="p-6 text-center">
              <p className="text-sm text-muted-foreground">
                {all.length === 0
                  ? "Scholarship listings are being updated. Check back soon or talk to a counsellor about current funding routes."
                  : "No scholarships match these filters. Try another destination or clear the search."}
              </p>
              <div className="mt-4 flex justify-center gap-4">
                {(country !== "" || q !== "") && (
                  <button
                    type="button"
                    onClick={() => {
                      setCountry("");
                      setQ("");
                    }}
                    className="text-sm font-medium text-global underline"
                  >
                    Clear all filters
                  </button>
                )}
                <Link
                  to="/global-education/contact"
                  className="text-sm font-medium text-global underline"
                >
                  Ask a counsellor
                </Link>
              </div>
            </li>
          )}
        </ul>
        <p className="text-xs text-muted-foreground mt-4">
          Funding amounts and deadlines change every intake — always confirm on the linked official
          source before applying. Also explore{" "}
          <Link to="/global-education/countries" className="underline">
            destinations
          </Link>
          ,{" "}
          <Link to="/global-education/universities" className="underline">
            universities
          </Link>{" "}
          and{" "}
          <Link to="/global-education/visa-guidance" className="underline">
            visa guidance
          </Link>
          .
        </p>
      </Section>
    </>
  );
}
