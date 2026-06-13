import { cn } from "@/lib/utils";

export type TechItem = { name: string; group?: string };
export type TechGroup = { title: string; items: string[] };

/**
 * Grid of technology badges, optionally grouped by category
 * (Frontend / Backend / Mobile / Database / Cloud / DevOps / AI).
 */
export function TechStackGrid({
  groups,
  className,
}: {
  groups: TechGroup[];
  className?: string;
}) {
  return (
    <div className={cn("grid gap-6 md:grid-cols-2 lg:grid-cols-3", className)}>
      {groups.map((g) => (
        <article
          key={g.title}
          className="rounded-2xl bg-card p-6 ring-1 ring-border [box-shadow:var(--shadow-card)]"
        >
          <h3 className="text-xs font-semibold uppercase tracking-widest text-tech mb-4">
            {g.title}
          </h3>
          <ul className="flex flex-wrap gap-2">
            {g.items.map((item) => (
              <li
                key={item}
                className="rounded-md bg-muted/70 px-2.5 py-1 text-xs font-medium text-ink"
              >
                {item}
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}
