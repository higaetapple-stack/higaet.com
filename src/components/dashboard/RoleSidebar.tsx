import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  User,
  GraduationCap,
  BookOpen,
  Users,
  ClipboardList,
  ClipboardCheck,
  Award,
  Rocket,
  ShieldCheck,
  Briefcase,
  Plane,
  Building2,
  Lock,
  MessagesSquare,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppRole } from "@/lib/auth.functions";

type Item = {
  to:
    | "/dashboard"
    | "/dashboard/profile"
    | "/dashboard/security"
    | "/dashboard/programs"
    | "/dashboard/assignments"
    | "/dashboard/projects"
    | "/dashboard/certificates"
    | "/dashboard/career"
    | "/dashboard/applications"
    | "/dashboard/visa"
    | "/dashboard/faculty"
    | "/dashboard/faculty/submissions"
    | "/dashboard/counselor"
    | "/dashboard/technologies"
    | "/dashboard/technologies/client"
    | "/dashboard/admin"
    | "/community";
  label: string;
  icon: typeof LayoutDashboard;
  roles: "all" | AppRole[];
};

const ITEMS: Item[] = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, roles: "all" },
  { to: "/dashboard/profile", label: "My profile", icon: User, roles: "all" },
  { to: "/dashboard/security", label: "Security", icon: Lock, roles: "all" },
  { to: "/community", label: "Community", icon: MessagesSquare, roles: "all" },
  { to: "/dashboard/programs", label: "My programs", icon: GraduationCap, roles: ["student"] },
  { to: "/dashboard/assignments", label: "Assignments", icon: ClipboardCheck, roles: ["student"] },
  { to: "/dashboard/projects", label: "Projects", icon: Rocket, roles: ["student"] },
  { to: "/dashboard/certificates", label: "Certificates", icon: Award, roles: ["student"] },
  { to: "/dashboard/career", label: "Career", icon: Briefcase, roles: ["student"] },
  { to: "/dashboard/applications", label: "Study abroad", icon: Plane, roles: ["student"] },
  { to: "/dashboard/visa", label: "My visa", icon: Plane, roles: ["student"] },
  { to: "/dashboard/faculty", label: "Faculty workspace", icon: BookOpen, roles: ["faculty", "mentor"] },
  { to: "/dashboard/faculty/submissions", label: "Grading queue", icon: ClipboardList, roles: ["faculty", "mentor"] },
  { to: "/dashboard/counselor", label: "Counselling", icon: ClipboardList, roles: ["counselor", "placement_officer"] },
  { to: "/dashboard/technologies", label: "Technologies", icon: Building2, roles: ["admin", "super_admin"] },
  { to: "/dashboard/technologies/client", label: "My projects", icon: Building2, roles: ["tech_client"] },
  { to: "/dashboard/admin", label: "Admin", icon: ShieldCheck, roles: ["admin", "super_admin"] },
];

export function RoleSidebar({ roles }: { roles: AppRole[] }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items = ITEMS.filter((it) => it.roles === "all" || it.roles.some((r) => roles.includes(r)));

  return (
    <aside className="w-60 shrink-0 border-r border-border bg-surface hidden md:flex flex-col">
      <nav className="flex-1 p-3">
        <ul className="space-y-0.5">
          {items.map((it) => {
            const active = it.to === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(it.to);
            const Icon = it.icon;
            return (
              <li key={it.to}>
                <Link
                  to={it.to}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
                    active
                      ? "bg-academy/10 text-academy font-medium"
                      : "text-muted-foreground hover:text-ink hover:bg-muted",
                  )}
                >
                  <Icon className="size-4" />
                  {it.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="p-3 border-t border-border">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Roles</div>
        <div className="flex flex-wrap gap-1">
          {roles.length === 0 ? (
            <span className="text-xs text-muted-foreground">none</span>
          ) : (
            roles.map((r) => (
              <span key={r} className="inline-flex items-center text-[10px] font-medium uppercase tracking-wider bg-muted text-ink px-1.5 py-0.5 rounded">
                {r.replace(/_/g, " ")}
              </span>
            ))
          )}
        </div>
      </div>
      <div className="hidden">
        <Users className="size-4" />
      </div>
    </aside>
  );
}
