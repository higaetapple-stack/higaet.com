import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ChevronDown,
  ArrowRight,
  GraduationCap,
  MapPin,
  Sparkles,
  Briefcase,
  Users2,
  Building2,
  Award,
  HelpCircle,
  Mail,
  BookOpen,
} from "lucide-react";
import { PROGRAMS, CAMPUSES, CATEGORY_LABELS, type ProgramCategory } from "@/lib/academy-programs";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const CATEGORY_ORDER: ProgramCategory[] = [
  "ai",
  "data",
  "engineering",
  "cloud",
  "cyber",
  "product",
];

const RESOURCES = [
  {
    to: "/academy/learning-paths",
    label: "Learning Paths",
    body: "Tracks by background and goal.",
    icon: Sparkles,
  },
  {
    to: "/academy/placements",
    label: "Placements",
    body: "300+ hiring partners and support.",
    icon: Briefcase,
  },
  {
    to: "/academy/scholarship",
    label: "Scholarship",
    body: "Merit and need-based awards.",
    icon: Award,
  },
  {
    to: "/academy/corporate-training",
    label: "Corporate Training",
    body: "Upskilling for teams.",
    icon: Building2,
  },
  {
    to: "/academy/success-stories",
    label: "Success Stories",
    body: "Outcomes from our graduates.",
    icon: Users2,
  },
  {
    to: "/academy/certifications",
    label: "Certifications",
    body: "Industry-recognised credentials.",
    icon: Award,
  },
  {
    to: "/academy/internships",
    label: "Internships",
    body: "Project-based experience.",
    icon: BookOpen,
  },
  {
    to: "/academy/admissions",
    label: "Admissions",
    body: "Apply and book counselling.",
    icon: GraduationCap,
  },
  { to: "/academy/faq", label: "FAQ", body: "Programs, fees, and process.", icon: HelpCircle },
  { to: "/academy/contact", label: "Contact", body: "Talk to a HIGAET advisor.", icon: Mail },
] as const;

export type MegaPanel = null | "programs" | "resources" | "campuses";

const PANEL_IDS: Record<Exclude<MegaPanel, null>, string> = {
  programs: "academy-mega-panel-programs",
  resources: "academy-mega-panel-resources",
  campuses: "academy-mega-panel-campuses",
};

/**
 * Shared open/close state for the Academy mega menu. Triggers and panels are
 * rendered in separate containers (see AcademySubHeader) so the absolutely
 * positioned panels are never clipped by the horizontally scrolling trigger row.
 */
export function useAcademyMegaMenu() {
  const [open, setOpen] = useState<MegaPanel>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(null);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const toggle = useCallback((panel: Exclude<MegaPanel, null>) => {
    setOpen((v) => {
      const next = v === panel ? null : panel;
      if (next) trackEvent("academy_mega_menu_open", { panel: next });
      return next;
    });
  }, []);

  const close = useCallback(() => setOpen(null), []);

  return { open, toggle, close, containerRef };
}

export function AcademyMegaMenuTriggers({
  open,
  onToggle,
}: {
  open: MegaPanel;
  onToggle: (panel: Exclude<MegaPanel, null>) => void;
}) {
  return (
    <ul className="flex items-center gap-1 text-sm font-medium text-muted-foreground whitespace-nowrap">
      <li>
        <MegaTrigger
          label="Programs"
          panelId={PANEL_IDS.programs}
          expanded={open === "programs"}
          onClick={() => onToggle("programs")}
        />
      </li>
      <li>
        <MegaTrigger
          label="Resources"
          panelId={PANEL_IDS.resources}
          expanded={open === "resources"}
          onClick={() => onToggle("resources")}
        />
      </li>
      <li>
        <MegaTrigger
          label="Campuses"
          panelId={PANEL_IDS.campuses}
          expanded={open === "campuses"}
          onClick={() => onToggle("campuses")}
        />
      </li>
      <li>
        <Link
          to="/academy/learning-paths"
          className="px-3 py-1.5 rounded-md hover:text-ink hover:bg-muted/60 transition-colors"
          activeProps={{ className: "text-ink bg-muted" }}
        >
          Learning Paths
        </Link>
      </li>
      <li>
        <Link
          to="/academy/placements"
          className="px-3 py-1.5 rounded-md hover:text-ink hover:bg-muted/60 transition-colors"
          activeProps={{ className: "text-ink bg-muted" }}
        >
          Placements
        </Link>
      </li>
      <li>
        <Link
          to="/academy/corporate-training"
          className="px-3 py-1.5 rounded-md hover:text-ink hover:bg-muted/60 transition-colors"
          activeProps={{ className: "text-ink bg-muted" }}
        >
          Corporate
        </Link>
      </li>
    </ul>
  );
}

export function AcademyMegaMenuPanels({ open, onClose }: { open: MegaPanel; onClose: () => void }) {
  return (
    <>
      {open === "programs" && <ProgramsPanel id={PANEL_IDS.programs} onClose={onClose} />}
      {open === "resources" && <ResourcesPanel id={PANEL_IDS.resources} onClose={onClose} />}
      {open === "campuses" && <CampusesPanel id={PANEL_IDS.campuses} onClose={onClose} />}
    </>
  );
}

function MegaTrigger({
  label,
  panelId,
  expanded,
  onClick,
}: {
  label: string;
  panelId: string;
  expanded: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      aria-controls={panelId}
      aria-haspopup="true"
      className={cn(
        "inline-flex items-center gap-1 px-3 py-1.5 rounded-md hover:text-ink hover:bg-muted/60 transition-colors",
        expanded && "text-ink bg-muted",
      )}
    >
      {label}
      <ChevronDown
        className={cn("size-3.5 transition-transform", expanded && "rotate-180")}
        aria-hidden
      />
    </button>
  );
}

function PanelShell({
  children,
  onClose,
  wide,
  id,
}: {
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
  id: string;
}) {
  return (
    <div
      role="dialog"
      aria-label="Mega menu"
      id={id}
      className={cn(
        "absolute left-0 right-0 top-full z-40 mt-2 rounded-xl bg-popover ring-1 ring-border shadow-[var(--shadow-elevated)] overflow-hidden",
        wide ? "w-[min(1100px,calc(100vw-3rem))]" : "w-[min(900px,calc(100vw-3rem))]",
      )}
      onMouseLeave={onClose}
    >
      {children}
    </div>
  );
}

function ProgramsPanel({ onClose, id }: { onClose: () => void; id: string }) {
  const grouped = new Map<ProgramCategory, typeof PROGRAMS>();
  for (const p of PROGRAMS) {
    const list = grouped.get(p.category) ?? [];
    list.push(p);
    grouped.set(p.category, list);
  }
  return (
    <PanelShell onClose={onClose} id={id} wide>
      <div className="grid grid-cols-12 gap-0">
        <div className="col-span-9 p-6 grid grid-cols-3 gap-x-6 gap-y-8">
          {CATEGORY_ORDER.filter((c) => grouped.has(c)).map((cat) => (
            <div key={cat}>
              <div className="text-[11px] font-semibold uppercase tracking-widest text-academy mb-3">
                {CATEGORY_LABELS[cat]}
              </div>
              <ul className="space-y-2.5">
                {grouped.get(cat)!.map((p) => (
                  <li key={p.slug}>
                    <Link
                      to="/academy/programs/$slug"
                      params={{ slug: p.slug }}
                      onClick={onClose}
                      className="group flex flex-col gap-0.5 -mx-2 px-2 py-1.5 rounded-md hover:bg-muted/60 transition-colors"
                    >
                      <span className="text-sm font-medium text-ink leading-snug">{p.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {p.level} · {p.duration}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <aside className="col-span-3 bg-academy/5 p-6 border-l border-border flex flex-col">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-academy">
            Get started
          </div>
          <h3 className="font-display text-lg font-medium text-ink mt-3 leading-snug">
            Not sure which program fits?
          </h3>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            Book a 20-minute counselling call. We'll map your background to the right HIGAET track.
          </p>
          <div className="mt-auto pt-6 space-y-2">
            <Link
              to="/academy/admissions"
              onClick={onClose}
              className="inline-flex items-center justify-center gap-2 w-full bg-academy text-white text-xs font-medium px-3 py-2 rounded-md hover:opacity-90"
            >
              Book counselling <ArrowRight className="size-3.5" />
            </Link>
            <Link
              to="/academy/programs"
              onClick={onClose}
              className="inline-flex items-center justify-center w-full ring-1 ring-border text-ink text-xs font-medium px-3 py-2 rounded-md hover:bg-muted transition-colors"
            >
              Browse all programs
            </Link>
          </div>
        </aside>
      </div>
    </PanelShell>
  );
}

function ResourcesPanel({ onClose, id }: { onClose: () => void; id: string }) {
  return (
    <PanelShell onClose={onClose} id={id}>
      <div className="p-6 grid grid-cols-2 gap-3">
        {RESOURCES.map((r) => {
          const Icon = r.icon;
          return (
            <Link
              key={r.to}
              to={r.to}
              onClick={onClose}
              className="group flex items-start gap-3 p-3 rounded-lg hover:bg-muted/60 transition-colors"
            >
              <div className="size-9 rounded-md bg-academy/10 text-academy grid place-items-center shrink-0">
                <Icon className="size-4" aria-hidden />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-ink">{r.label}</div>
                <div className="text-xs text-muted-foreground leading-snug mt-0.5">{r.body}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </PanelShell>
  );
}

function CampusesPanel({ onClose, id }: { onClose: () => void; id: string }) {
  return (
    <PanelShell onClose={onClose} id={id}>
      <div className="p-6 grid grid-cols-2 gap-3">
        {CAMPUSES.map((c) => (
          <Link
            key={c.slug}
            to="/academy/campuses/$slug"
            params={{ slug: c.slug }}
            onClick={onClose}
            className="group flex items-start gap-3 p-4 rounded-lg ring-1 ring-border hover:ring-academy/40 transition-colors"
          >
            <div className="size-9 rounded-md bg-academy/10 text-academy grid place-items-center shrink-0">
              <MapPin className="size-4" aria-hidden />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-ink">{c.name}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{c.city}</div>
              <div className="text-xs text-academy mt-1">{c.degree}</div>
            </div>
          </Link>
        ))}
        <Link
          to="/academy/campuses"
          onClick={onClose}
          className="col-span-2 inline-flex items-center justify-center gap-1.5 text-xs font-medium text-academy py-2 rounded-md hover:bg-academy/10 transition-colors"
        >
          View all campuses <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </PanelShell>
  );
}
