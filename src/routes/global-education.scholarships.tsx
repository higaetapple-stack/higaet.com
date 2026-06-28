import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Section } from "@/components/site/Section";
import { listScholarshipsPublic } from "@/lib/study-abroad.functions";

import { buildServiceJsonLdScripts } from "@/lib/seo/service-schema";
import { SERVICE_SCHEMAS } from "@/lib/seo/global-education-services";

export const Route = createFileRoute("/global-education/scholarships")({
  head: () => ({
    meta: [
      { title: "Study-Abroad Scholarships — HIGAET" },
      { name: "description", content: "Active merit, need-based, and institutional scholarships for international students applying through HIGAET." },
      { property: "og:url", content: "https://higaet.com/global-education/scholarships" },
    ],
    links: [{ rel: "canonical", href: "https://higaet.com/global-education/scholarships" }],
    scripts: buildServiceJsonLdScripts(SERVICE_SCHEMAS["scholarships"]),
  }),
  component: ScholarshipsPage,
});

function ScholarshipsPage() {
  const fetcher = useServerFn(listScholarshipsPublic);
  const q = useQuery({ queryKey: ["public-scholarships"], queryFn: () => fetcher() });
  return (
    <>
      <PageHero brand="global" eyebrow="Scholarships" title="Funding routes that reduce your cost." subtitle="Filter by destination and apply directly. Our counsellors help you strengthen each application." />
      <Section>
        {q.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        <ul className="divide-y divide-border ring-1 ring-border rounded-2xl bg-card">
          {(q.data ?? []).map((s: any) => (
            <li key={s.id} className="p-5 flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-ink font-medium">{s.name}</span>
                  {s.countries && <Link to="/global-education/countries/$slug" params={{ slug: s.countries.slug }} className="text-xs text-global">{s.countries.flag_emoji} {s.countries.name}</Link>}
                </div>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{s.description}</p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {s.coverage && <span>{s.coverage}</span>}
                  {s.eligibility && <span className="line-clamp-1">Eligibility: {s.eligibility}</span>}
                </div>
              </div>
              <div className="text-right">
                {s.amount_usd && <div className="text-ink font-medium">${Number(s.amount_usd).toLocaleString()}</div>}
                {s.deadline && <div className="text-xs text-muted-foreground">Apply by {s.deadline}</div>}
                {s.apply_url && <a href={s.apply_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-global">Apply <ExternalLink className="size-3" /></a>}
              </div>
            </li>
          ))}
          {q.data?.length === 0 && <li className="p-6 text-sm text-muted-foreground text-center">No scholarships listed yet.</li>}
        </ul>
      </Section>
    </>
  );
}
