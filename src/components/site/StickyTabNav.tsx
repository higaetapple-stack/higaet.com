import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type TabItem = { id: string; label: string };

/**
 * Sticky in-page tab nav for long service detail pages.
 * Smooth-scrolls to anchored sections and highlights the active one.
 */
export function StickyTabNav({
  items,
  offset = 96,
  className,
}: {
  items: TabItem[];
  offset?: number;
  className?: string;
}) {
  const [active, setActive] = useState<string>(items[0]?.id ?? "");

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible?.target.id) setActive(visible.target.id);
      },
      { rootMargin: `-${offset}px 0px -60% 0px`, threshold: [0, 1] },
    );
    items.forEach((i) => {
      const el = document.getElementById(i.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [items, offset]);

  const handleClick = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "smooth" });
    setActive(id);
  };

  return (
    <nav
      aria-label="Page sections"
      className={cn(
        "sticky top-16 z-30 border-y border-border bg-surface/85 backdrop-blur-md",
        className,
      )}
    >
      <div className="max-w-7xl mx-auto px-6">
        <ul className="flex items-center gap-1 overflow-x-auto py-2 text-sm font-medium text-muted-foreground">
          {items.map((i) => (
            <li key={i.id}>
              <a
                href={`#${i.id}`}
                onClick={handleClick(i.id)}
                className={cn(
                  "inline-flex whitespace-nowrap rounded-md px-3 py-1.5 transition-colors hover:text-ink hover:bg-muted/60",
                  active === i.id && "bg-muted text-ink",
                )}
              >
                {i.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
