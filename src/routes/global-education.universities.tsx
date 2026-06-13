import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Search } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Section } from "@/components/site/Section";
import { Input } from "@/components/ui/input";
import { listUniversitiesPublic, listCountriesPublic } from "@/lib/study-abroad.functions";

export const Route = createFileRoute("/global-education/universities")({
  head: () => ({
    meta: [
      { title: "Partner Universities — HIGAET Global Education Hub" },
      { name: "description", content: "Browse partner universities across the USA, Canada, UK, Australia, Germany, Ireland, New Zealand, and Singapore." },
      { property: "og:url", content: "/global-education/universities" },
    ],
    links: [{ rel: "canonical", href: "/global-education/universities" }],
  }),
  component: UniversitiesPage,
});

function UniversitiesPage() {
  const list = useServerFn(listUniversitiesPublic);
  const listC = useServerFn(listCountriesPublic);
  const [country, setCountry] = useState<string>("");
  const [q, setQ] = useState("");
  const countries = useQuery({ queryKey: ["public-countries"], queryFn: () => listC() });
  const unis = useQuery({ queryKey: ["public-unis", country, q], queryFn: () => list({ data: { country: country || undefined, q: q || undefined } }) });

  return (
    <>
      <PageHero brand="global" eyebrow="Universities" title="Find your best-fit university." subtitle="Filter by destination, search by name. Click through for programs, tuition, intakes, and an application starter." />
      <Section>
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search universities…" className="pl-9" />
          </div>
          <select value={country} onChange={(e) => setCountry(e.target.value)} className="h-10 rounded-md ring-1 ring-border px-3 text-sm bg-background">
            <option value="">All countries</option>
            {(countries.data ?? []).map((c: any) => <option key={c.id} value={c.slug}>{c.flag_emoji} {c.name}</option>)}
          </select>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(unis.data ?? []).map((u: any) => (
            <Link key={u.id} to="/global-education/universities/$slug" params={{ slug: u.slug }} className="group rounded-2xl ring-1 ring-border bg-card p-5 hover:ring-global/40">
              <div className="text-xs text-muted-foreground">{u.countries?.flag_emoji} {u.countries?.name} · {u.city}</div>
              <div className="mt-2 font-display text-lg text-ink group-hover:text-global">{u.name}</div>
              <div className="mt-3 flex gap-3 text-xs">
                {u.world_ranking && <span className="text-global font-medium">#{u.world_ranking} world</span>}
                {u.avg_tuition_usd && <span className="text-muted-foreground">${Number(u.avg_tuition_usd).toLocaleString()}/yr</span>}
                {u.featured && <span className="bg-global/10 text-global px-1.5 rounded">Featured</span>}
              </div>
            </Link>
          ))}
          {unis.data?.length === 0 && <p className="text-sm text-muted-foreground col-span-full text-center py-12">No universities found.</p>}
        </div>
      </Section>
    </>
  );
}
