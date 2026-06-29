import { Link } from "@tanstack/react-router";
import { getHubAuthority } from "@/lib/seo/hub-authority";
import { TOPIC_CLUSTERS, type ClusterId } from "@/lib/seo/topic-clusters";

interface HubAuthorityBlockProps {
  clusterId: ClusterId;
  className?: string;
}

/**
 * HIGAET P5.2 — Authority-grade semantic block injected into every hub.
 *
 * Renders:
 *   1. Definition snippet (featured-snippet optimized)
 *   2. Comparative table
 *   3. Workflow steps
 *   4. Entity reinforcement section
 *   5. Reinforcement loop linking the top 5 spokes
 *
 * Silently renders nothing when no authority data is registered.
 */
export function HubAuthorityBlock({ clusterId, className }: HubAuthorityBlockProps) {
  const data = getHubAuthority(clusterId);
  if (!data) return null;
  const cluster = TOPIC_CLUSTERS[clusterId];
  if (!cluster) return null;

  const spokeIndex = new Map(cluster.spokes.map((s) => [s.path, s]));
  const topSpokes = data.topSpokes
    .map((p) => spokeIndex.get(p))
    .filter((s): s is NonNullable<typeof s> => !!s)
    .slice(0, 5);

  return (
    <section
      aria-label={`${cluster.title} — authority overview`}
      data-seo-block="hub-authority"
      data-cluster-id={clusterId}
      className={className ?? "mx-auto w-full max-w-6xl px-4 py-12 md:py-16"}
    >
      {/* Definition snippet */}
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          What is {cluster.title}?
        </p>
        <p className="mt-2 text-base md:text-lg leading-relaxed">{data.definition}</p>
      </div>

      {/* Comparison table */}
      <div className="mt-10 overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Option</th>
              <th className="px-4 py-3">Use case</th>
              <th className="px-4 py-3">Difficulty</th>
              <th className="px-4 py-3">Outcome</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.comparison.map((row) => (
              <tr key={row.option}>
                <td className="px-4 py-3 font-medium">{row.option}</td>
                <td className="px-4 py-3 text-muted-foreground">{row.useCase}</td>
                <td className="px-4 py-3">{row.difficulty}</td>
                <td className="px-4 py-3 text-muted-foreground">{row.outcome}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Workflow */}
      <div className="mt-10">
        <h3 className="text-xl font-semibold">How it works</h3>
        <ol className="mt-4 grid gap-3 md:grid-cols-2">
          {data.workflow.map((s) => (
            <li key={s.step} className="rounded-lg border border-border/70 p-4">
              <p className="font-medium">{s.step}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>

      {/* Entities */}
      <div className="mt-10">
        <h3 className="text-xl font-semibold">Entities & systems</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(
            [
              ["Countries", data.entities.countries],
              ["Institutions", data.entities.institutions],
              ["Systems", data.entities.systems],
              ["Funding", data.entities.funding],
              ["Tools", data.entities.tools],
            ] as const
          )
            .filter(([, items]) => items && items.length > 0)
            .map(([label, items]) => (
              <div key={label} className="rounded-lg border border-border/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {label}
                </p>
                <ul className="mt-2 flex flex-wrap gap-2 text-sm">
                  {items!.map((it) => (
                    <li key={it} className="rounded-md bg-muted/60 px-2 py-1">
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </div>
      </div>

      {/* Reinforcement loop — top 5 spokes */}
      {topSpokes.length > 0 && (
        <div className="mt-10">
          <h3 className="text-xl font-semibold">Highest-impact next steps</h3>
          <ul
            data-seo-block="hub-reinforcement"
            className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            {topSpokes.map((s) => (
              <li key={s.path}>
                <Link
                  to={s.path}
                  className="block rounded-lg border border-border/70 p-4 transition hover:border-primary/60"
                >
                  <p className="font-medium">{s.anchor}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{s.blurb}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export default HubAuthorityBlock;
