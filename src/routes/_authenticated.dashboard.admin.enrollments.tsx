import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { adminEnrollStudent, adminListEnrollments, adminUnenroll } from "@/lib/learn.functions";
import { listPrograms, listUsersWithRoles } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/dashboard/admin/enrollments")({
  component: EnrollmentsPage,
});

function EnrollmentsPage() {
  const fetchEnrollments = useServerFn(adminListEnrollments);
  const enroll = useServerFn(adminEnrollStudent);
  const unenroll = useServerFn(adminUnenroll);
  const fetchPrograms = useServerFn(listPrograms);
  const fetchUsers = useServerFn(listUsersWithRoles);
  const qc = useQueryClient();

  const [filterProgram, setFilterProgram] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<{ user_id: string; program_id: string }>({ user_id: "", program_id: "" });
  const [search, setSearch] = useState("");

  const enrollmentsQ = useQuery({
    queryKey: ["admin-enrollments", filterProgram],
    queryFn: () => fetchEnrollments({ data: { program_id: filterProgram !== "all" ? filterProgram : undefined } }),
  });
  const programsQ = useQuery({ queryKey: ["admin-programs"], queryFn: () => fetchPrograms() });
  const studentsQ = useQuery({
    queryKey: ["admin-students-pool"],
    queryFn: () => fetchUsers({ data: { role: "student" } }),
    enabled: open,
  });

  const enrollMut = useMutation({
    mutationFn: async () => enroll({ data: picked }),
    onSuccess: () => {
      toast.success("Student enrolled");
      qc.invalidateQueries({ queryKey: ["admin-enrollments"] });
      setOpen(false);
      setPicked({ user_id: "", program_id: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const unenrollMut = useMutation({
    mutationFn: async (id: string) => unenroll({ data: { id } }),
    onSuccess: () => {
      toast.success("Unenrolled");
      qc.invalidateQueries({ queryKey: ["admin-enrollments"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filteredStudents = (studentsQ.data ?? []).filter((u: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (u.email ?? "").toLowerCase().includes(q) || (u.full_name ?? "").toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <h2 className="font-display text-lg font-medium text-ink">Enrollments</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Enroll students into programs. Self-serve enrollment + payments arrive in a later sprint.
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={filterProgram} onValueChange={setFilterProgram}>
            <SelectTrigger className="w-56"><SelectValue placeholder="Filter by program" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">All programs</SelectItem>
              {programsQ.data?.map((p: any) => (
                <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-academy text-academy-foreground hover:bg-academy/90">
                <Plus className="size-4" /> Enroll student
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Enroll a student</DialogTitle></DialogHeader>
              <div className="grid gap-3">
                <div>
                  <Label>Program</Label>
                  <Select value={picked.program_id} onValueChange={(v) => setPicked((p) => ({ ...p, program_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Choose…" /></SelectTrigger>
                    <SelectContent>
                      {programsQ.data?.map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Search student</Label>
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name or email" />
                </div>
                <div className="max-h-56 overflow-y-auto rounded-md ring-1 ring-border divide-y divide-border">
                  {filteredStudents.length === 0 && (
                    <p className="p-3 text-xs text-muted-foreground">No matching students.</p>
                  )}
                  {filteredStudents.map((u: any) => (
                    <button
                      key={u.id}
                      onClick={() => setPicked((p) => ({ ...p, user_id: u.id }))}
                      className={`w-full text-left p-2.5 text-sm flex items-center justify-between hover:bg-muted ${picked.user_id === u.id ? "bg-academy/10" : ""}`}
                    >
                      <div className="min-w-0">
                        <div className="text-ink truncate">{u.full_name || "—"}</div>
                        <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                      </div>
                      {picked.user_id === u.id && <Badge className="bg-academy text-academy-foreground">Selected</Badge>}
                    </button>
                  ))}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button
                  onClick={() => enrollMut.mutate()}
                  disabled={!picked.user_id || !picked.program_id || enrollMut.isPending}
                  className="bg-academy text-academy-foreground hover:bg-academy/90"
                >Enroll</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="rounded-xl bg-card ring-1 ring-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Student</th>
              <th className="text-left px-4 py-2 font-medium">Program</th>
              <th className="text-left px-4 py-2 font-medium">Status</th>
              <th className="text-left px-4 py-2 font-medium">Enrolled</th>
              <th className="text-right px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {enrollmentsQ.isLoading && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>}
            {!enrollmentsQ.isLoading && enrollmentsQ.data?.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No enrolments yet.</td></tr>
            )}
            {enrollmentsQ.data?.map((e: any) => (
              <tr key={e.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <div className="text-ink">{e.profiles?.full_name || "—"}</div>
                  <div className="text-xs text-muted-foreground">{e.profiles?.email}</div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{e.programs?.title}</td>
                <td className="px-4 py-3"><Badge variant="secondary">{e.status}</Badge></td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(e.enrolled_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => unenrollMut.mutate(e.id)}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
