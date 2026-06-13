import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getPublicPortfolio } from "@/lib/portfolio.functions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Github, Linkedin, Globe, Mail, Phone, MapPin, Award, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/portfolio/$slug")({
  loader: async ({ params }) => {
    const data = await getPublicPortfolio({ data: { slug: params.slug } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ params, loaderData }) => {
    const d: any = loaderData;
    const title = d ? `${d.full_name ?? "Portfolio"} | ${d.headline ?? "HIGAET Graduate"} | HIGAET` : "Portfolio";
    const description = d?.bio ?? "Projects, certifications, and skills earned through HIGAET Academy.";
    const noindex = d?.visibility !== "public";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        ...(noindex ? [{ name: "robots", content: "noindex" }] : []),
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "profile" },
        { property: "og:url", content: `/portfolio/${params.slug}` },
      ],
      links: noindex ? [] : [{ rel: "canonical", href: `/portfolio/${params.slug}` }],
      scripts:
        d && !noindex
          ? [
              {
                type: "application/ld+json",
                children: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "Person",
                  name: d.full_name,
                  jobTitle: d.headline ?? undefined,
                  description: d.bio ?? undefined,
                  image: d.avatar_url ?? undefined,
                  sameAs: [d.github_url, d.linkedin_url, d.website_url].filter(Boolean),
                }),
              },
            ]
          : [],
    };
  },
  component: PortfolioPage,
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center px-6">
      <div className="text-center">
        <h1 className="font-display text-3xl text-ink">Portfolio not found</h1>
        <p className="text-sm text-muted-foreground mt-2">This handle is private or doesn't exist.</p>
        <Link to="/" className="mt-4 inline-block text-academy text-sm">← Back to HIGAET</Link>
      </div>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen grid place-items-center"><p className="text-sm text-muted-foreground">{error.message}</p></div>
  ),
});

function PortfolioPage() {
  const d = Route.useLoaderData() as any;
  const initial = (d.full_name ?? "?").trim().charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link to="/" className="text-xs uppercase tracking-[0.3em] text-academy font-medium">HIGAET Portfolio</Link>
          <Link to="/academy" className="text-xs text-muted-foreground hover:text-ink">Become a HIGAET graduate →</Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <Avatar className="size-24">
            {d.avatar_url && <AvatarImage src={d.avatar_url} />}
            <AvatarFallback className="text-3xl">{initial}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h1 className="font-display text-4xl font-medium text-ink">{d.full_name}</h1>
            {d.headline && <p className="text-base text-muted-foreground mt-1">{d.headline}</p>}
            {d.location && <p className="text-sm text-muted-foreground mt-1 inline-flex items-center gap-1"><MapPin className="size-3.5" />{d.location}</p>}
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              {d.email && <a href={`mailto:${d.email}`} className="inline-flex items-center gap-1 text-academy hover:underline"><Mail className="size-3.5" />{d.email}</a>}
              {d.phone && <span className="inline-flex items-center gap-1 text-muted-foreground"><Phone className="size-3.5" />{d.phone}</span>}
              {d.linkedin_url && <a href={d.linkedin_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-academy hover:underline"><Linkedin className="size-3.5" />LinkedIn</a>}
              {d.github_url && <a href={d.github_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-academy hover:underline"><Github className="size-3.5" />GitHub</a>}
              {d.website_url && <a href={d.website_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-academy hover:underline"><Globe className="size-3.5" />Website</a>}
            </div>
          </div>
        </div>

        {d.bio && (
          <Section title="About">
            <p className="text-sm leading-relaxed text-ink/90 whitespace-pre-wrap">{d.bio}</p>
          </Section>
        )}

        {d.skills?.length > 0 && (
          <Section title="Skills">
            <div className="flex flex-wrap gap-2">
              {d.skills.map((s: string) => (
                <span key={s} className="text-xs bg-academy/10 text-academy px-2 py-1 rounded">{s}</span>
              ))}
            </div>
          </Section>
        )}

        {d.certificates?.length > 0 && (
          <Section title="HIGAET Certifications">
            <ul className="grid sm:grid-cols-2 gap-3">
              {d.certificates.map((c: any) => (
                <li key={c.id} className="rounded-lg ring-1 ring-border p-4 bg-card">
                  <div className="flex items-start gap-3">
                    <Award className="size-5 text-academy mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-ink">{c.programs?.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">Issued {new Date(c.issued_at).toLocaleDateString()}</div>
                      <Link to="/verify-certificate/$id" params={{ id: c.certificate_number }} className="text-xs text-academy inline-flex items-center gap-1 mt-2">
                        Verify <ExternalLink className="size-3" />
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {d.projects?.length > 0 && (
          <Section title="Projects">
            <ul className="space-y-3">
              {d.projects.map((p: any) => (
                <li key={p.id} className="rounded-lg ring-1 ring-border p-4 bg-card">
                  <div className="font-medium text-ink">{p.projects?.title}</div>
                  {p.summary && <p className="text-sm text-muted-foreground mt-1">{p.summary}</p>}
                  <div className="mt-2 flex gap-3 text-xs">
                    {p.repo_url && <a href={p.repo_url} target="_blank" rel="noopener noreferrer" className="text-academy">Repo →</a>}
                    {p.demo_url && <a href={p.demo_url} target="_blank" rel="noopener noreferrer" className="text-academy">Demo →</a>}
                  </div>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {Array.isArray(d.experience) && d.experience.length > 0 && (
          <Section title="Experience">
            <ul className="space-y-4">
              {d.experience.map((e: any, i: number) => (
                <li key={i}>
                  <div className="flex justify-between gap-3">
                    <div className="font-medium text-ink">{e.title} <span className="text-muted-foreground font-normal">· {e.company}</span></div>
                    <div className="text-xs text-muted-foreground">{e.start}{e.end ? ` – ${e.end}` : ""}</div>
                  </div>
                  {e.summary && <p className="text-sm text-muted-foreground mt-1">{e.summary}</p>}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {Array.isArray(d.education) && d.education.length > 0 && (
          <Section title="Education">
            <ul className="space-y-2">
              {d.education.map((e: any, i: number) => (
                <li key={i} className="flex justify-between gap-3 text-sm">
                  <div><strong className="text-ink">{e.school}</strong>{e.degree ? `, ${e.degree}` : ""}{e.field ? ` (${e.field})` : ""}</div>
                  <div className="text-xs text-muted-foreground">{e.start}{e.end ? ` – ${e.end}` : ""}</div>
                </li>
              ))}
            </ul>
          </Section>
        )}
      </main>

      <footer className="border-t border-border bg-card py-6 text-center text-xs text-muted-foreground">
        Powered by <Link to="/academy" className="text-academy">HIGAET Academy</Link>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">{title}</h2>
      {children}
    </section>
  );
}
