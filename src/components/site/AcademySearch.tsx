import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, GraduationCap, MapPin, Compass, Sparkles, ArrowRight } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { PROGRAMS, CAMPUSES, CATEGORY_LABELS, type ProgramCategory } from "@/lib/academy-programs";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const QUICK_LINKS = [
  { label: "All Programs", to: "/academy/programs", icon: Compass },
  { label: "Learning Paths", to: "/academy/learning-paths", icon: Sparkles },
  { label: "Placements", to: "/academy/placements", icon: ArrowRight },
  { label: "Scholarship", to: "/academy/scholarship", icon: Sparkles },
  { label: "Corporate Training", to: "/academy/corporate-training", icon: ArrowRight },
  { label: "Success Stories", to: "/academy/success-stories", icon: ArrowRight },
  { label: "Admissions", to: "/academy/admissions", icon: ArrowRight },
  { label: "FAQ", to: "/academy/faq", icon: ArrowRight },
  { label: "Contact", to: "/academy/contact", icon: ArrowRight },
] as const;

export function AcademySearchTrigger({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inField =
        target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !inField)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) trackEvent("academy_search_open");
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search Academy (press / or Cmd+K)"
        className={cn(
          "inline-flex items-center gap-2 rounded-md ring-1 ring-border bg-card px-2.5 py-1.5 text-xs text-muted-foreground hover:text-ink hover:ring-academy/40 transition-colors",
          className,
        )}
      >
        <Search className="size-3.5" aria-hidden />
        <span className="hidden sm:inline">Search Academy…</span>
        <kbd className="hidden md:inline-flex items-center rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          /
        </kbd>
      </button>
      <AcademySearchDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

function AcademySearchDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const navigate = useNavigate();

  const programsByCategory = useMemo(() => {
    const grouped = new Map<ProgramCategory, typeof PROGRAMS>();
    for (const p of PROGRAMS) {
      const list = grouped.get(p.category) ?? [];
      list.push(p);
      grouped.set(p.category, list);
    }
    return grouped;
  }, []);

  const go = (label: string, fn: () => void) => {
    trackEvent("academy_search_result_click", { label });
    fn();
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search programs, learning paths, campuses…"
        onValueChange={(v) => v && trackEvent("academy_search_query", { q: v })}
      />
      <CommandList>
        <CommandEmpty>No matches. Try a topic like "AI", "Data", or "Cloud".</CommandEmpty>

        <CommandGroup heading="Quick links">
          {QUICK_LINKS.map((l) => {
            const Icon = l.icon;
            return (
              <CommandItem
                key={l.to}
                value={`link ${l.label}`}
                onSelect={() => go(l.label, () => navigate({ to: l.to }))}
              >
                <Icon className="size-4 text-academy" />
                <span>{l.label}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        {Array.from(programsByCategory.entries()).map(([cat, list]) => (
          <CommandGroup key={cat} heading={CATEGORY_LABELS[cat]}>
            {list.map((p) => (
              <CommandItem
                key={p.slug}
                value={`${p.title} ${p.tagline} ${CATEGORY_LABELS[p.category]}`}
                onSelect={() =>
                  go(p.title, () =>
                    navigate({ to: "/academy/programs/$slug", params: { slug: p.slug } }),
                  )
                }
              >
                <GraduationCap className="size-4 text-academy" />
                <div className="flex min-w-0 flex-col">
                  <span className="truncate">{p.title}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {p.level} · {p.duration} · {p.format}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}

        <CommandSeparator />

        <CommandGroup heading="Campuses">
          {CAMPUSES.map((c) => (
            <CommandItem
              key={c.slug}
              value={`campus ${c.city} ${c.name} ${c.degree}`}
              onSelect={() =>
                go(c.name, () =>
                  navigate({ to: "/academy/campuses/$slug", params: { slug: c.slug } }),
                )
              }
            >
              <MapPin className="size-4 text-academy" />
              <div className="flex min-w-0 flex-col">
                <span className="truncate">{c.name}</span>
                <span className="truncate text-xs text-muted-foreground">{c.city} · {c.degree}</span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
