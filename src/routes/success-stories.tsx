import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listSuccessStories } from "@/lib/stories.functions";
import { Award, ExternalLink, Star, Trophy } from "lucide-react";

const storiesQuery = queryOptions({
  queryKey: ["public-success-stories"],
  queryFn: () => listSuccessStories(),
});

export const Route = createFileRoute("/success-stories")({
  head: () => ({
    meta: [
      { title: "Success Stories — HIGAET Academy" },
      {
        name: "description",
        content:
          "Featured graduates, placements, and a growing community of public portfolios from HIGAET Academy learners.",
      },
      { property: "og:title", content: "HIGAET Academy — Success Stories" },
      {
        property: "og:description",
        content: "Featured graduates and placement highlights from HIGAET Academy.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(storiesQuery),
  component: SuccessStoriesPage,
  errorComponent: ({ error }) => <div className="p-8 text-sm">{error.message}</div>,
  notFoundComponent: () => <div className="p-8 text-sm">Not found.</div>,
});

function SuccessStoriesPage() {
  const { data } = useSuspenseQuery(storiesQuery);
  const { featured, community, placements } = data;

  return (
    <div className="bg-background min-h-screen">
      <section className="border-b border-border bg-surface">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="text-xs uppercase tracking-wider text-academy font-medium">Success stories</div>
          <h1 className="font-display text-4xl md:text-5xl font-medium text-ink mt-3 max-w-3xl">
            Real learners. Real outcomes.
          </h1>
          <p className="text-muted-foreground mt-4 max-w-2xl">
            HIGAET Academy graduates building careers across AI engineering, product, and applied technology.
          </p>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-12">
          <SectionHeader icon={Star} title="Featured graduates" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
            {featured.map((p: any) => (
              <article key={p.id} className="rounded-2xl bg-card ring-1 ring-border p-5">
                <div className="flex items-center gap-3">
                  <Avatar src={p.avatar_url} name={p.full_name} />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-ink truncate">{p.full_name}</div>
                    <div className="text-xs text-muted-foreground truncate">{p.headline}</div>
                  </div>
                </div>
                {p.success_story_summary && (
                  <p className="text-sm text-ink mt-4">{p.success_story_summary}</p>
                )}
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Award className="size-3.5" /> {p.certificates_count} certificates
                  </span>
                  {p.portfolio_slug && (
                    <Link
                      to="/portfolio/$slug"
                      params={{ slug: p.portfolio_slug }}
                      className="text-xs text-academy hover:underline flex items-center gap-1"
                    >
                      Portfolio <ExternalLink className="size-3" />
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {placements.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-12 border-t border-border">
          <SectionHeader icon={Trophy} title="Placement highlights" />
          <ul className="mt-6 grid sm:grid-cols-2 gap-4">
            {placements.map((p: any) => (
              <li key={p.id} className="rounded-2xl bg-card ring-1 ring-border p-5">
                <div className="text-sm font-medium text-ink">
                  {p.profiles?.full_name} → {p.employers?.name ?? "—"}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {p.job_title} · {p.employment_type}
                  {p.programs?.title && ` · ${p.programs.title}`}
                </div>
                {p.profiles?.portfolio_slug && (
                  <Link
                    to="/portfolio/$slug"
                    params={{ slug: p.profiles.portfolio_slug }}
                    className="text-xs text-academy hover:underline mt-3 inline-flex items-center gap-1"
                  >
                    View portfolio <ExternalLink className="size-3" />
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {community.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-12 border-t border-border">
          <SectionHeader icon={Award} title="Community portfolios" />
          <p className="text-sm text-muted-foreground mt-1">
            Auto-updated from HIGAET learners who published their portfolio publicly.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {community.map((p: any) => (
              <Link
                key={p.id}
                to="/portfolio/$slug"
                params={{ slug: p.portfolio_slug }}
                className="rounded-2xl bg-card ring-1 ring-border p-4 hover:ring-academy/40 transition"
              >
                <div className="flex items-center gap-3">
                  <Avatar src={p.avatar_url} name={p.full_name} />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-ink truncate">{p.full_name}</div>
                    <div className="text-xs text-muted-foreground truncate">{p.headline ?? "HIGAET learner"}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {featured.length + community.length + placements.length === 0 && (
        <div className="max-w-6xl mx-auto px-6 py-24 text-center text-muted-foreground">
          Success stories will appear here as HIGAET learners publish portfolios and graduate.
        </div>
      )}
    </div>
  );
}

function SectionHeader({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="size-5 text-academy" />
      <h2 className="font-display text-2xl font-medium text-ink">{title}</h2>
    </div>
  );
}

function Avatar({ src, name }: { src?: string | null; name?: string | null }) {
  return (
    <div className="size-10 rounded-full bg-muted overflow-hidden grid place-items-center shrink-0 text-sm">
      {src ? (
        <img src={src} alt={name ?? ""} className="size-full object-cover" />
      ) : (
        <span>{(name ?? "?").charAt(0).toUpperCase()}</span>
      )}
    </div>
  );
}
