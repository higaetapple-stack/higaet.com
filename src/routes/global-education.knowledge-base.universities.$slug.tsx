import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Section } from "@/components/site/Section";
import { getUniversityKB } from "@/content/universities-kb";

const BASE = "/global-education/knowledge-base/universities";

export const Route = createFileRoute(
  "/global-education/knowledge-base/universities/$slug",
)({
  head: ({ params }) => {
    const u = getUniversityKB(params.slug);
    if (!u) {
      return {
        meta: [
          { title: "University not found — HIGAET" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const url = `${BASE}/${u.slug}`;
    const description = `${u.name} in ${u.city}, ${u.countryName}. Programs, tuition, admissions, scholarships, and FAQs — curated by HIGAET Global Education Hub.`;
    return {
      meta: [
        { title: `${u.name} — Programs, Tuition & Admissions | HIGAET` },
        { name: "description", content: description },
        { property: "og:title", content: `${u.name} | HIGAET Knowledge Base` },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
        { property: "og:type", content: "article" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "CollegeOrUniversity",
              name: u.name,
              url: url,
              sameAs: u.website,
              foundingDate: String(u.founded),
              address: {
                "@type": "PostalAddress",
                addressLocality: u.city,
                addressCountry: u.country,
              },
              description: u.overview,
              parentOrganization: {
                "@type": "EducationalOrganization",
                name: "HIGAET Global Education Hub",
                url: "/higaet-global-education-hub",
              },
            },
            {
              "@context": "https://schema.org",
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
                {
                  "@type": "ListItem",
                  position: 4,
                  name: u.name,
                  item: url,
                },
              ],
            },
            {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: u.faqs.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
              })),
            },
          ]),
        },
      ],
    };
  },
  component: UniversityKBDetail,
  notFoundComponent: () => (
    <Section>
      <div className="p-10 text-center">
        <h1 className="font-display text-2xl mb-2">University not found</h1>
        <Link to="/global-education/knowledge-base/universities" className="text-global underline">
          Back to all universities
        </Link>
      </div>
    </Section>
  ),
});

function UniversityKBDetail() {
  const { slug } = Route.useParams();
  const u = getUniversityKB(slug);
  if (!u) throw notFound();

  return (
    <>
      <PageHero
        brand="global"
        eyebrow={`${u.countryName} · ${u.city}`}
        title={u.name}
        subtitle={u.overview}
      >
        <div className="flex flex-wrap gap-3 items-center text-sm">
          <Link
            to="/global-education/knowledge-base/universities"
            className="inline-flex items-center gap-1 text-muted-foreground hover:text-ink"
          >
            <ArrowLeft className="size-3" /> All universities
          </Link>
          <a
            href={u.website}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 ring-1 ring-border px-3 py-1.5 rounded-md hover:bg-muted"
          >
            Official site <ExternalLink className="size-4" />
          </a>
          {u.worldRanking && (
            <span className="ring-1 ring-border px-3 py-1.5 rounded-md bg-card">
              World rank #{u.worldRanking}
            </span>
          )}
          <span className="ring-1 ring-border px-3 py-1.5 rounded-md bg-card">
            Founded {u.founded}
          </span>
        </div>
      </PageHero>

      <Section>
        <div className="grid lg:grid-cols-[2fr_1fr] gap-10">
          <div className="space-y-10">
            <div>
              <h2 className="font-display text-2xl text-ink mb-3">Overview</h2>
              <p className="text-ink/90 leading-relaxed">{u.overview}</p>
            </div>

            <div>
              <h2 className="font-display text-2xl text-ink mb-3">Programs</h2>
              <ul className="grid sm:grid-cols-2 gap-2">
                {u.programs.map((p) => (
                  <li
                    key={p}
                    className="ring-1 ring-border rounded-lg bg-card px-3 py-2 text-sm text-ink"
                  >
                    {p}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="font-display text-2xl text-ink mb-3">
                Admission requirements
              </h2>
              <ul className="list-disc pl-5 text-ink/90 space-y-1">
                {u.admissions.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="font-display text-2xl text-ink mb-3">Scholarships</h2>
              <ul className="list-disc pl-5 text-ink/90 space-y-1">
                {u.scholarships.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="font-display text-2xl text-ink mb-3">FAQs</h2>
              <div className="space-y-3">
                {u.faqs.map((f) => (
                  <details
                    key={f.q}
                    className="ring-1 ring-border rounded-lg bg-card p-4"
                  >
                    <summary className="cursor-pointer font-medium text-ink">
                      {f.q}
                    </summary>
                    <p className="mt-2 text-ink/85 text-sm">{f.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-3">
            <Fact label="Country" value={`${u.countryName}`} />
            <Fact label="City" value={u.city} />
            {u.worldRanking && (
              <Fact label="World ranking" value={`#${u.worldRanking}`} />
            )}
            {u.tuitionUsd.undergrad && (
              <Fact label="Undergraduate tuition" value={u.tuitionUsd.undergrad} />
            )}
            {u.tuitionUsd.postgrad && (
              <Fact label="Postgraduate tuition" value={u.tuitionUsd.postgrad} />
            )}
            <div className="rounded-2xl ring-1 ring-border bg-card p-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                Get help applying
              </div>
              <p className="text-sm text-ink/85 mb-3">
                HIGAET counsellors can help you shortlist programs, build your
                profile, and apply to {u.name}.
              </p>
              <Link
                to="/global-education/contact"
                className="inline-flex items-center justify-center w-full bg-global text-white hover:bg-global/90 rounded-md px-4 py-2 text-sm"
              >
                Talk to a counsellor
              </Link>
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl ring-1 ring-border bg-card p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-ink font-medium">{value}</div>
    </div>
  );
}
