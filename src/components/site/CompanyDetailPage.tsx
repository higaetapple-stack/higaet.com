import { Link } from "@tanstack/react-router";
import { ServiceHero } from "./ServiceHero";
import { StickyTabNav } from "./StickyTabNav";
import { Section, Eyebrow } from "./Section";
import { CTASection } from "./CTASection";
import { breadcrumbJsonLd, type Crumb } from "./Breadcrumbs";
import { jsonLdScript } from "./JsonLd";
import { type CompanyContent, COMPANY_PAGES } from "@/content/company";

export function buildCompanyHead(p: CompanyContent) {
  const breadcrumbs: Crumb[] = [
    { label: "HIGAET", href: "/" },
    { label: "Technologies", href: "/technologies" },
    { label: "Company", href: "/technologies/company" },
    { label: p.eyebrow, href: p.path },
  ];
  return {
    meta: [
      { title: p.metaTitle },
      { name: "description", content: p.metaDescription },
      { property: "og:title", content: p.metaTitle },
      { property: "og:description", content: p.metaDescription },
      { property: "og:url", content: p.path },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: p.metaTitle },
      { name: "twitter:description", content: p.metaDescription },
    ],
    links: [{ rel: "canonical", href: p.path }],
    scripts: [
      jsonLdScript({
        "@context": "https://schema.org",
        "@type": "AboutPage",
        name: p.title,
        url: p.path,
        description: p.metaDescription,
        mainEntity: {
          "@type": "Organization",
          name: "HIGAET Technologies",
          url: "/technologies",
        },
      }),
      jsonLdScript(breadcrumbJsonLd(breadcrumbs)),
    ],
  };
}

export function CompanyDetailPage({ content: p }: { content: CompanyContent }) {
  const breadcrumbs: Crumb[] = [
    { label: "HIGAET", href: "/" },
    { label: "Technologies", href: "/technologies" },
    { label: "Company", href: "/technologies/company" },
    { label: p.eyebrow, href: p.path },
  ];

  const tocItems = [
    { id: "summary", label: "Summary" },
    ...p.sections.map((s) => ({ id: s.id, label: s.heading })),
    { id: "related", label: "Related" },
  ];

  const related = COMPANY_PAGES.filter((q) => q.slug !== p.slug).slice(0, 6);

  return (
    <>
      <ServiceHero
        brand="tech"
        eyebrow={`Company · ${p.group}`}
        title={p.title}
        subtitle={p.intro}
        breadcrumbs={breadcrumbs}
        primaryHref="/technologies/contact"
        primaryLabel="Talk to our team"
        secondaryHref="/technologies/company"
        secondaryLabel="All company pages"
        highlights={p.highlights}
      />

      <StickyTabNav items={tocItems} />

      <Section id="summary">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.3fr] lg:items-end">
          <div>
            <Eyebrow brand="tech">Executive summary</Eyebrow>
            <h2 className="mt-4 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink text-balance">
              {p.eyebrow}, in one paragraph.
            </h2>
          </div>
          <p className="text-lg leading-relaxed text-muted-foreground text-pretty max-w-[62ch]">
            {p.summary}
          </p>
        </div>
      </Section>

      {p.sections.map((s, idx) => (
        <Section key={s.id} id={s.id} className={idx % 2 === 0 ? "bg-muted/40" : ""}>
          <Eyebrow brand="tech">{`0${idx + 1}`.slice(-2)}</Eyebrow>
          <h2 className="mt-4 mb-6 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink text-balance max-w-[42ch]">
            {s.heading}
          </h2>
          <div className="space-y-5 max-w-[68ch]">
            {s.body.map((b, bi) => (
              <p key={bi} className="text-base md:text-lg leading-relaxed text-muted-foreground text-pretty">
                {b}
              </p>
            ))}
          </div>
          {s.bullets && (
            <ul className="mt-8 grid gap-3 md:grid-cols-2 max-w-3xl">
              {s.bullets.map((b) => (
                <li key={b} className="rounded-2xl bg-card p-4 ring-1 ring-border text-sm leading-relaxed text-ink">
                  {b}
                </li>
              ))}
            </ul>
          )}
        </Section>
      ))}

      <Section id="related">
        <Eyebrow brand="tech">More about HIGAET Technologies</Eyebrow>
        <h2 className="mt-4 mb-8 font-display text-3xl md:text-4xl font-medium tracking-tight text-ink text-balance">
          Continue exploring.
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {related.map((r) => (
            <Link
              key={r.slug}
              to={r.path}
              className="block rounded-2xl bg-card p-5 ring-1 ring-border hover:ring-foreground/30 transition"
            >
              <span className="text-[11px] font-semibold uppercase tracking-widest text-tech">{r.group}</span>
              <h3 className="mt-2 font-display text-lg font-medium text-ink">{r.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-3">{r.intro}</p>
            </Link>
          ))}
        </div>
      </Section>

      {p.cta && (
        <CTASection
          eyebrow="HIGAET Technologies"
          title={p.cta.title}
          body={p.cta.body}
          primaryHref="/technologies/contact"
          primaryLabel="Start a conversation"
          secondaryHref="/technologies/case-studies"
          secondaryLabel="See client work"
        />
      )}
    </>
  );
}
