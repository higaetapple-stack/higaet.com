import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { grantRole, listUsersWithRoles, revokeRole } from "@/lib/admin.functions";
import type { AppRole } from "@/lib/auth.functions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/admin/users")({
  component: UsersPage,
});

const ROLE_OPTIONS: { value: AppRole; label: string }[] = [
  { value: "student", label: "Student" },
  { value: "faculty", label: "Faculty" },
  { value: "mentor", label: "Mentor" },
  { value: "counselor", label: "Counselor" },
  { value: "placement_officer", label: "Placement Officer" },
  { value: "enterprise_client", label: "Enterprise Client" },
  { value: "admin", label: "Admin" },
  { value: "super_admin", label: "Super Admin" },
];

function UsersPage() {
  const fetchUsers = useServerFn(listUsersWithRoles);
  const grant = useServerFn(grantRole);
  const revoke = useServerFn(revokeRole);
  const qc = useQueryClient();
  const [filter, setFilter] = useState<AppRole | "all">("all");
  const [search, setSearch] = useState("");

  const usersQ = useQuery({
    queryKey: ["admin-users", filter],
    queryFn: () => fetchUsers({ data: { role: filter } }),
  });

  const grantMut = useMutation({
    mutationFn: async (vars: { user_id: string; role: AppRole }) => grant({ data: vars }),
    onSuccess: () => {
      toast.success("Role granted");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["faculty-pool"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const revokeMut = useMutation({
    mutationFn: async (vars: { user_id: string; role: AppRole }) => revoke({ data: vars }),
    onSuccess: () => {
      toast.success("Role revoked");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["faculty-pool"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = (usersQ.data ?? []).filter((u: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (u.email ?? "").toLowerCase().includes(q) || (u.full_name ?? "").toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <h2 className="font-display text-lg font-medium text-ink">Users & Roles</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Grant and revoke roles. Faculty need the <strong>faculty</strong> role before they can be assigned to courses.
          </p>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Search email or name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56"
          />
          <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              {ROLE_OPTIONS.map((r) => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-xl bg-card ring-1 ring-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2 font-medium">User</th>
              <th className="text-left px-4 py-2 font-medium">Roles</th>
              <th className="text-right px-4 py-2 font-medium">Grant role</th>
            </tr>
          </thead>
          <tbody>
            {usersQ.isLoading && <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>}
            {!usersQ.isLoading && rows.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-10 text-center text-muted-foreground">No users.</td></tr>
            )}
            {rows.map((u: any) => (
              <UserRow
                key={u.id}
                user={u}
                onGrant={(role) => grantMut.mutate({ user_id: u.id, role })}
                onRevoke={(role) => revokeMut.mutate({ user_id: u.id, role })}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UserRow({
  user,
  onGrant,
  onRevoke,
}: {
  user: any;
  onGrant: (role: AppRole) => void;
  onRevoke: (role: AppRole) => void;
}) {
  const [picked, setPicked] = useState<AppRole>("student");
  const userRoles: AppRole[] = user.roles ?? [];
  return (
    <tr className="border-t border-border align-top">
      <td className="px-4 py-3">
        <div className="text-sm font-medium text-ink">{user.full_name || "—"}</div>
        <div className="text-xs text-muted-foreground">{user.email}</div>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {userRoles.length === 0 && <span className="text-xs text-muted-foreground">none</span>}
          {userRoles.map((r) => (
            <Badge key={r} variant="secondary" className="gap-1">
              {r.replace(/_/g, " ")}
              <button onClick={() => onRevoke(r)} className="hover:text-destructive">
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-2">
          <Select value={picked} onValueChange={(v) => setPicked(v as AppRole)}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.map((r) => (
                <SelectItem key={r.value} value={r.value} disabled={userRoles.includes(r.value)}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            onClick={() => onGrant(picked)}
            disabled={userRoles.includes(picked)}
            className="bg-academy text-academy-foreground hover:bg-academy/90"
          >
            <Plus className="size-3.5" /> Grant
          </Button>
        </div>
      </td>
    </tr>
  );
}
