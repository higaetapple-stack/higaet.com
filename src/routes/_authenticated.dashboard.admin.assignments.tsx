import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  deleteAssignment,
  listAssignments,
  listPrograms,
  listCourses,
  upsertAssignment,
} from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/admin/assignments")({
  component: AssignmentsPage,
});

function AssignmentsPage() {
  const fetchPrograms = useServerFn(listPrograms);
  const fetchCourses = useServerFn(listCourses);
  const fetchAssignments = useServerFn(listAssignments);
  const save = useServerFn(upsertAssignment);
  const del = useServerFn(deleteAssignment);
  const qc = useQueryClient();

  const programsQ = useQuery({ queryKey: ["admin-programs"], queryFn: () => fetchPrograms() });
  const [programId, setProgramId] = useState<string | "">("");
  const coursesQ = useQuery({
    queryKey: ["admin-courses", programId],
    queryFn: () => fetchCourses({ data: { program_id: programId as string } }),
    enabled: !!programId,
  });
  const [courseId, setCourseId] = useState<string | "">("");
  const assignmentsQ = useQuery({
    queryKey: ["admin-assignments", courseId],
    queryFn: () => fetchAssignments({ data: { course_id: courseId as string } }),
    enabled: !!courseId,
  });

  const [editing, setEditing] = useState<any | null>(null);
  const empty = useMemo(
    () => ({ id: undefined, course_id: courseId, title: "", description: "", due_date: "", max_score: 100 }),
    [courseId],
  );

  const saveMut = useMutation({
    mutationFn: async (a: any) =>
      save({
        data: {
          ...a,
          due_date: a.due_date ? new Date(a.due_date).toISOString() : "",
        },
      }),
    onSuccess: () => {
      toast.success("Assignment saved");
      qc.invalidateQueries({ queryKey: ["admin-assignments", courseId] });
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const delMut = useMutation({
    mutationFn: async (id: string) => del({ data: { id } }),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-assignments", courseId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <div className="mb-4">
        <h2 className="font-display text-lg font-medium text-ink">Assignments</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Author assignments. Student submissions and grading land in Sprint 2C.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="min-w-56">
          <Label>Program</Label>
          <Select value={programId} onValueChange={(v) => { setProgramId(v); setCourseId(""); }}>
            <SelectTrigger><SelectValue placeholder="Choose…" /></SelectTrigger>
            <SelectContent>
              {programsQ.data?.map((p: any) => (
                <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-56">
          <Label>Course</Label>
          <Select value={courseId} onValueChange={setCourseId} disabled={!programId}>
            <SelectTrigger><SelectValue placeholder={programId ? "Choose…" : "Select a program first"} /></SelectTrigger>
            <SelectContent>
              {coursesQ.data?.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="self-end">
          <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                disabled={!courseId}
                onClick={() => setEditing(empty)}
                className="bg-academy text-academy-foreground hover:bg-academy/90"
              >
                <Plus className="size-4" /> New assignment
              </Button>
            </DialogTrigger>
            {editing && (
              <DialogContent>
                <DialogHeader><DialogTitle>{editing.id ? "Edit" : "New"} assignment</DialogTitle></DialogHeader>
                <div className="grid gap-3">
                  <div>
                    <Label>Title</Label>
                    <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea rows={4} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Due date</Label>
                      <Input type="datetime-local" value={editing.due_date ?? ""} onChange={(e) => setEditing({ ...editing, due_date: e.target.value })} />
                    </div>
                    <div>
                      <Label>Max score</Label>
                      <Input type="number" value={editing.max_score} onChange={(e) => setEditing({ ...editing, max_score: Number(e.target.value) })} />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                  <Button
                    disabled={!editing.title || saveMut.isPending}
                    onClick={() => saveMut.mutate(editing)}
                    className="bg-academy text-academy-foreground hover:bg-academy/90"
                  >Save</Button>
                </DialogFooter>
              </DialogContent>
            )}
          </Dialog>
        </div>
      </div>

      <div className="rounded-xl bg-card ring-1 ring-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Title</th>
              <th className="text-left px-4 py-2 font-medium">Due</th>
              <th className="text-left px-4 py-2 font-medium">Max</th>
              <th className="text-right px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!courseId && <tr><td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">Pick a program and course to view assignments.</td></tr>}
            {courseId && assignmentsQ.isLoading && <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>}
            {courseId && assignmentsQ.data?.length === 0 && <tr><td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">No assignments yet.</td></tr>}
            {assignmentsQ.data?.map((a: any) => (
              <tr key={a.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium text-ink">{a.title}</td>
                <td className="px-4 py-3 text-muted-foreground">{a.due_date ? new Date(a.due_date).toLocaleString() : "—"}</td>
                <td className="px-4 py-3">{a.max_score}</td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="sm" onClick={() => setEditing({ ...a, due_date: a.due_date ? new Date(a.due_date).toISOString().slice(0, 16) : "" })}>
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => delMut.mutate(a.id)}>
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
