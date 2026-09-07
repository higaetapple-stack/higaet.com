import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { HubRelatedLinks } from "@/components/site/HubRelatedLinks";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { Input } from "@/components/ui/input";
import { Section } from "@/components/site/Section";
import { UNIVERSITIES_KB, KB_COUNTRIES, getUniversitiesByCountry } from "@/content/universities-kb";

const BASE = "/global-education/knowledge-base/universities";

export const Route = createFileRoute("/global-education/knowledge-base/universities/")({
  head: () => ({
    meta: [
      {
        title:
          "University Knowledge Base — Top Universities in USA, UK, Canada & Australia | HIGAET",
      },
      {
        name: "description",
        content:
          "Verified profiles of 50 top universities across the USA, UK, Canada, and Australia: programs, tuition, admissions, scholarships, and FAQs. Curated by HIGAET Global Education Hub.",
      },
      {
        property: "og:title",
        content: "HIGAET University Knowledge Base",
      },
      {
        property: "og:description",
        content:
          "Top universities across USA, UK, Canada and Australia with tuition, programs, scholarships, and FAQs.",
      },
      { property: "og:url", content: BASE },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "HIGAET University Knowledge Base",
          url: BASE,
          isPartOf: { "@type": "WebSite", name: "HIGAET" },
          about: {
            "@type": "EducationalOrganization",
            name: "HIGAET Global Education Hub",
            url: "/higaet-global-education-hub",
          },
          breadcrumb: {
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "/" },
              {
                "@type": "ListItem",
                position: 2,
                name: "Global Education",
                item: "/global-education",
              },
              {
                "@type": "ListItem",
                position: 3,
                name: "University Knowledge Base",
                item: BASE,
              },
            ],
          },
          hasPart: UNIVERSITIES_KB.map((u) => ({
            "@type": "CollegeOrUniversity",
            name: u.name,
            url: `${BASE}/${u.slug}`,
            address: {
              "@type": "PostalAddress",
              addressLocality: u.city,
              addressCountry: u.country,
            },
          })),
        }),
      },
    ],
  }),
  component: UniversityKBIndex,
});

function UniversityKBIndex() {
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const matches = (u: { name: string; city: string; overview: string }) =>
    needle === "" || `${u.name} ${u.city} ${u.overview}`.toLowerCase().includes(needle);
  return (
    <>
      <PageHero
        brand="global"
        eyebrow="HIGAET Global Education Hub"
        title="University Guides & Profiles"
        subtitle={`In-depth profiles of ${UNIVERSITIES_KB.length} leading universities across the USA, UK, Canada, and Australia — programs, tuition, admissions, scholarships, and answers to common questions.`}
      >
        <div className="flex flex-wrap gap-2 text-sm">
          {KB_COUNTRIES.map((c) => (
            <a
              key={c.code}
              href={`#${c.code}`}
              className="inline-flex items-center gap-2 ring-1 ring-border bg-card hover:bg-muted px-3 py-1.5 rounded-full text-ink"
            >
              <span aria-hidden>{c.flag}</span>
              {c.name}
              <span className="text-muted-foreground">
                ({getUniversitiesByCountry(c.code).length})
              </span>
            </a>
          ))}
        </div>
      </PageHero>

      <Section className="!pt-6">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Global Education Hub", href: "/global-education" },
            { label: "University Guides" },
          ]}
        />
        <div className="relative max-w-md mt-6">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <label htmlFor="kb-university-search" className="sr-only">
            Search university guides by name
          </label>
          <Input
            id="kb-university-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search guides by university name…"
            className="pl-9"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Prefer filtering by destination? Try{" "}
          <Link to="/global-education/universities" className="text-global underline">
            Find Universities
          </Link>
          .
        </p>
      </Section>
      {KB_COUNTRIES.map((c) => {
        const list = getUniversitiesByCountry(c.code).filter(matches);
        if (needle !== "" && list.length === 0) return null;
        return (
          <Section key={c.code} id={c.code} ariaLabel={`${c.name} universities`}>
            <div className="flex items-end justify-between mb-6">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  {c.flag} {c.name}
                </div>
                <h2 className="font-display text-3xl text-ink">Top universities in {c.name}</h2>
              </div>
              <div className="text-sm text-muted-foreground">{list.length} profiles</div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {list.map((u) => (
                <Link
                  key={u.slug}
                  to="/global-education/knowledge-base/universities/$slug"
                  params={{ slug: u.slug }}
                  className="block rounded-2xl ring-1 ring-border bg-card p-5 hover:ring-global hover:shadow-sm transition"
                >
                  <div className="text-xs text-muted-foreground">
                    {u.city}
                    {u.worldRanking ? ` · World #${u.worldRanking}` : ""}
                  </div>
                  <div className="mt-1 font-display text-lg text-ink leading-tight">{u.name}</div>
                  <p className="mt-2 text-sm text-ink/80 line-clamp-3">{u.overview}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {u.programs.slice(0, 3).map((p) => (
                      <span
                        key={p}
                        className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-ink/80"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </Section>
        );
      })}
      {needle !== "" &&
        KB_COUNTRIES.every(
          (c) => getUniversitiesByCountry(c.code).filter(matches).length === 0,
        ) && (
          <Section>
            <p className="text-sm text-muted-foreground text-center py-8">
              No guides match “{q}”.{" "}
              <button type="button" onClick={() => setQ("")} className="text-global underline">
                Clear the search
              </button>{" "}
              or{" "}
              <Link to="/global-education/universities" className="text-global underline">
                browse all universities
              </Link>
              .
            </p>
          </Section>
        )}
      <HubRelatedLinks
        brand="global"
        eyebrow="Plan further"
        title="Match the university to the journey."
        ringHoverClass="hover:ring-global/40"
        links={[
          {
            to: "/global-education/countries",
            label: "Study destinations",
            body: "Compare countries on tuition, intakes, language, and visa highlights.",
          },
          {
            to: "/academy/programs",
            label: "HIGAET Academy programs",
            body: "Domestic AI career tracks for learners building skills before going abroad.",
          },
        ]}
      />
    </>
  );
}
