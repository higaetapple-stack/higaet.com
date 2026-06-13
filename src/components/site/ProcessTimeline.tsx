import { cn } from "@/lib/utils";

export type ProcessStep = {
  title: string;
  body: string;
  deliverables?: string[];
};

export function ProcessTimeline({
  steps,
  className,
}: {
  steps: ProcessStep[];
  className?: string;
}) {
  return (
    <ol className={cn("relative grid gap-8 md:grid-cols-2 lg:grid-cols-3", className)}>
      {steps.map((s, i) => (
        <li
          key={s.title}
          className="relative rounded-2xl bg-card p-6 ring-1 ring-border [box-shadow:var(--shadow-card)]"
        >
          <div className="mb-4 flex items-center gap-3">
            <span className="grid size-8 place-items-center rounded-full bg-tech/10 text-xs font-semibold text-tech">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className="font-display text-lg font-medium text-ink">{s.title}</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
          {s.deliverables && s.deliverables.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-1.5">
              {s.deliverables.map((d) => (
                <li
                  key={d}
                  className="rounded-md bg-muted/70 px-2 py-0.5 text-[11px] font-medium text-ink"
                >
                  {d}
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ol>
  );
}
