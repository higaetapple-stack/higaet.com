import { cn } from "@/lib/utils";

/**
 * Logo strip placeholder. TODO: Replace `logos` with real partner brand marks
 * once licensed assets are available. Renders as wordmarks until then.
 */
export function TrustedBy({
  heading = "Trusted by teams across education, AI, and enterprise software",
  logos,
  className,
}: {
  heading?: string;
  logos?: string[];
  className?: string;
}) {
  const items =
    logos && logos.length > 0
      ? logos
      : ["Northwind", "Vertex Labs", "Helio Health", "Quanta AI", "Atlas Logistics", "Meridian"];
  return (
    <section
      aria-label="Trusted by"
      className={cn("border-y border-border bg-muted/30 py-10", className)}
    >
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-center text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          {heading}
        </p>
        <ul className="mt-6 grid grid-cols-2 items-center gap-x-8 gap-y-5 sm:grid-cols-3 md:grid-cols-6">
          {items.map((l) => (
            <li
              key={l}
              className="text-center font-display text-base font-medium text-ink/70 tracking-tight"
              title="TODO: replace with partner logo"
            >
              {l}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
