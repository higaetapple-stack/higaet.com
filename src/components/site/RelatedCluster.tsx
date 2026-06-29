import { Link } from "@tanstack/react-router";
import { getRelatedLinks, getCluster } from "@/lib/seo/topic-clusters";

interface RelatedClusterProps {
  /** Path of the current page (e.g. "/academy/programs"). */
  path: string;
  /** Optional heading override. */
  heading?: string;
  /** Max links to render. Default 6. */
  limit?: number;
  className?: string;
}

/**
 * Renders a topical-authority "Related" module: hub + sibling spokes +
 * cross-cluster suggestions. Anchor text is contextual (entity-laden) and
 * comes from the cluster registry — no generic "click here" links.
 *
 * Drop into any hub or spoke page:
 *   <RelatedCluster path="/academy/programs" />
 *
 * Silently renders nothing if the path isn't registered, so it's safe to
 * include on any marketing route.
 */
export function RelatedCluster({ path, heading, limit = 6, className }: RelatedClusterProps) {
  const entry = getCluster(path);
  const links = getRelatedLinks(path, limit);
  if (!entry || links.length === 0) return null;

  const title =
    heading ??
    (entry.role === "hub"
      ? `Explore ${entry.cluster.title}`
      : `More on ${entry.cluster.title}`);

  return (
    <section
      aria-label={title}
      className={
        className ??
        "mt-12 rounded-2xl border border-border bg-card/40 p-6 md:p-8"
      }
    >
      <h2 className="text-xl md:text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Part of the {entry.cluster.title} topic cluster at HIGAET.
      </p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {links.map((node) => (
          <li key={node.path}>
            <Link
              to={node.path}
              className="group block rounded-lg border border-border/60 p-4 transition hover:border-primary hover:bg-accent"
            >
              <span className="block font-medium group-hover:text-primary">
                {node.anchor}
              </span>
              <span className="mt-1 block text-sm text-muted-foreground">
                {node.blurb}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default RelatedCluster;
