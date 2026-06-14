import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Search,
  GraduationCap,
  MapPin,
  Compass,
  Sparkles,
  ArrowRight,
  BookOpen,
  Route as RouteIcon,
  LayoutGrid,
} from "lucide-react";
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
import {
  getAcademySearchIndex,
  academyCategoryUrl,
  academyCourseUrl,
  academyLearningPathUrl,
  type SearchRecord,
} from "@/content/providers";
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

/**
 * Resolve a search record to its live route URL via the Academy URL
 * resolver (ADR-0003). The generator's `record.url` field encodes the
 * canonical slug shape; the resolver maps it onto current live routes.
 */
function resolveRecordUrl(r: SearchRecord): string {
  const slug = r.url.split("/").pop() ?? "";
  switch (r.kind) {
    case "category":
      return academyCategoryUrl(slug);
    case "course":
      return academyCourseUrl(slug);
    case "learning-path":
      return academyLearningPathUrl(slug);
    default:
      return r.url;
  }
}

const RECORD_KIND_LABEL: Partial<Record<SearchRecord["kind"], string>> = {
  category: "Academy · Pillars",
  course: "Academy · Courses",
  "learning-path": "Academy · Learning Paths",
};

const RECORD_KIND_ICON: Partial<Record<SearchRecord["kind"], typeof LayoutGrid>> = {
  category: LayoutGrid,
  course: BookOpen,
  "learning-path": RouteIcon,
};

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

  // Provider-backed Academy registry records (categories, courses, paths).
  // Replaces the previously-missing registry source; PROGRAMS and CAMPUSES
  // groups below remain inline per Workstream B decisions D-B-2 / D-B-4.
  // getAcademySearchIndex returns `T | Promise<T>`; the static-registry
  // impl is synchronous, so we assert the sync branch here.
  const registryByKind = useMemo(() => {
    const records = getAcademySearchIndex() as readonly SearchRecord[];
    const grouped = new Map<SearchRecord["kind"], SearchRecord[]>();
    for (const r of records) {
      const list = grouped.get(r.kind) ?? [];
      list.push(r);
      grouped.set(r.kind, list);
    }
    return grouped;
  }, []);

  const go = (label: string, fn: () => void) => {
    trackEvent("academy_search_result_click", { label });
    fn();
    onOpenChange(false);
  };

  // TanStack `navigate({ to })` is typed against the route tree; dynamic
  // resolver URLs are runtime-valid but not statically in the union.
  const goToUrl = (label: string, url: string) =>
    go(label, () => navigate({ to: url } as Parameters<typeof navigate>[0]));

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

        {(["category", "course", "learning-path"] as const).map((kind) => {
          const list = registryByKind.get(kind);
          const heading = RECORD_KIND_LABEL[kind];
          const Icon = RECORD_KIND_ICON[kind];
          if (!list || list.length === 0 || !heading || !Icon) return null;
          return (
            <CommandGroup key={kind} heading={heading}>
              {list.map((r) => (
                <CommandItem
                  key={r.id}
                  value={`${r.title} ${r.description} ${(r.keywords ?? []).join(" ")}`}
                  onSelect={() => goToUrl(r.title, resolveRecordUrl(r))}
                >
                  <Icon className="size-4 text-academy" />
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate">{r.title}</span>
                    <span className="truncate text-xs text-muted-foreground">{r.description}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          );
        })}

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
