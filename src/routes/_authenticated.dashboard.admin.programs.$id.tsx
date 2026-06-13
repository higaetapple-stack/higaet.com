import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  assignFaculty,
  createCourse,
  deleteCourse,
  deleteLesson,
  getProgram,
  listCourseFaculty,
  listCourses,
  listLessons,
  listUsersWithRoles,
  programCategories,
  unassignFaculty,
  updateCourse,
  updateProgram,
  upsertLesson,
  type ProgramCategory,
  type ProgramStatus,
} from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Trash2, Pencil, UserPlus, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/admin/programs/$id")({
  component: ProgramEditPage,
});

const CATEGORY_LABEL: Record<ProgramCategory, string> = {
  ai_engineering: "AI Engineering",
  gen_ai: "Gen AI",
  ai_agents: "AI Agents",
  ai_automation: "AI Automation",
  prompt_engineering: "Prompt Engineering",
  fullstack_ai: "Full-Stack AI",
  data_science: "Data Science",
  cyber_security: "Cyber Security",
  cloud_computing: "Cloud Computing",
  study_abroad: "Study Abroad",
  corporate_training: "Corporate Training",
};

function ProgramEditPage() {
  const { id } = Route.useParams();
  const fetchProgram = useServerFn(getProgram);
  const { data: program, isLoading } = useQuery({
    queryKey: ["admin-program", id],
    queryFn: () => fetchProgram({ data: { id } }),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!program) {
    return (
      <div className="text-sm text-muted-foreground">
        Program not found.{" "}
        <Link to="/dashboard/admin/programs" className="text-academy underline">Back to programs</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link to="/dashboard/admin/programs"><ArrowLeft className="size-4" /> Back</Link>
        </Button>
        <div>
          <h2 className="font-display text-lg font-medium text-ink">{program.title}</h2>
          <div className="text-xs text-muted-foreground">
            /{program.slug} · <Badge variant="secondary">{program.status}</Badge>
          </div>
        </div>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="courses">Courses & Lessons</TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="mt-4">
          <ProgramDetailsForm program={program} />
        </TabsContent>
        <TabsContent value="courses" className="mt-4">
          <CoursesPanel programId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProgramDetailsForm({ program }: { program: any }) {
  const save = useServerFn(updateProgram);
  const qc = useQueryClient();
  const [form, setForm] = useState({
    slug: program.slug ?? "",
    title: program.title ?? "",
    category: (program.category ?? "ai_engineering") as ProgramCategory,
    level: program.level ?? "",
    format: program.format ?? "",
    duration: program.duration ?? "",
    fee_inr: program.fee_inr ?? "",
    description: program.description ?? "",
    thumbnail_url: program.thumbnail_url ?? "",
    status: program.status as ProgramStatus,
    featured: !!program.featured,
  });

  const mut = useMutation({
    mutationFn: async () => save({ data: { id: program.id, ...form } }),
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["admin-program", program.id] });
      qc.invalidateQueries({ queryKey: ["admin-programs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="rounded-xl bg-card ring-1 ring-border p-5">
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <Label>Title</Label>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div>
          <Label>Slug</Label>
          <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })} />
        </div>
        <div>
          <Label>Category</Label>
          <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as ProgramCategory })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {programCategories.map((c) => (
                <SelectItem key={c} value={c}>{CATEGORY_LABEL[c]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Level</Label>
          <Input value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} />
        </div>
        <div>
          <Label>Format</Label>
          <Input value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })} />
        </div>
        <div>
          <Label>Duration</Label>
          <Input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
        </div>
        <div>
          <Label>Fee (INR)</Label>
          <Input value={form.fee_inr} onChange={(e) => setForm({ ...form, fee_inr: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <Label>Description</Label>
          <Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <Label>Thumbnail URL</Label>
          <Input value={form.thumbnail_url} onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })} />
        </div>
        <div>
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as ProgramStatus })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <div className="flex items-center gap-2">
            <Switch checked={form.featured} onCheckedChange={(v) => setForm({ ...form, featured: v })} />
            <Label className="m-0">Featured</Label>
          </div>
        </div>
      </div>
      <div className="mt-5 flex justify-end">
        <Button
          onClick={() => mut.mutate()}
          disabled={mut.isPending}
          className="bg-academy text-academy-foreground hover:bg-academy/90"
        >
          {mut.isPending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}

function CoursesPanel({ programId }: { programId: string }) {
  const fetchCourses = useServerFn(listCourses);
  const createC = useServerFn(createCourse);
  const updateC = useServerFn(updateCourse);
  const deleteC = useServerFn(deleteCourse);
  const qc = useQueryClient();

  const coursesQ = useQuery({
    queryKey: ["admin-courses", programId],
    queryFn: () => fetchCourses({ data: { program_id: programId } }),
  });

  const [newOpen, setNewOpen] = useState(false);
  const [newCourse, setNewCourse] = useState({ slug: "", title: "", description: "", order_no: 0 });

  const createMut = useMutation({
    mutationFn: async () =>
      createC({
        data: {
          program_id: programId,
          slug: newCourse.slug,
          title: newCourse.title,
          description: newCourse.description,
          order_no: Number(newCourse.order_no) || 0,
          status: "draft",
        },
      }),
    onSuccess: () => {
      toast.success("Course created");
      qc.invalidateQueries({ queryKey: ["admin-courses", programId] });
      setNewOpen(false);
      setNewCourse({ slug: "", title: "", description: "", order_no: 0 });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => deleteC({ data: { id } }),
    onSuccess: () => {
      toast.success("Course deleted");
      qc.invalidateQueries({ queryKey: ["admin-courses", programId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium text-ink">Courses</h3>
        <Dialog open={newOpen} onOpenChange={setNewOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-academy text-academy-foreground hover:bg-academy/90">
              <Plus className="size-4" /> New course
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New course</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div>
                <Label>Title</Label>
                <Input value={newCourse.title} onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })} />
              </div>
              <div>
                <Label>Slug</Label>
                <Input value={newCourse.slug} onChange={(e) => setNewCourse({ ...newCourse, slug: e.target.value.toLowerCase() })} />
              </div>
              <div>
                <Label>Order</Label>
                <Input
                  type="number"
                  value={newCourse.order_no}
                  onChange={(e) => setNewCourse({ ...newCourse, order_no: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea rows={3} value={newCourse.description} onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewOpen(false)}>Cancel</Button>
              <Button
                disabled={createMut.isPending || !newCourse.title || !newCourse.slug}
                onClick={() => createMut.mutate()}
                className="bg-academy text-academy-foreground hover:bg-academy/90"
              >Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {coursesQ.isLoading && <p className="text-sm text-muted-foreground">Loading courses…</p>}
      {coursesQ.data?.length === 0 && (
        <div className="rounded-xl bg-card ring-1 ring-border p-10 text-center text-sm text-muted-foreground">
          No courses yet. Add the first course to start authoring lessons.
        </div>
      )}

      <div className="space-y-3">
        {coursesQ.data?.map((c: any) => (
          <CourseRow
            key={c.id}
            course={c}
            onUpdate={async (patch) => {
              await updateC({
                data: {
                  id: c.id,
                  program_id: programId,
                  slug: patch.slug ?? c.slug,
                  title: patch.title ?? c.title,
                  description: patch.description ?? (c.description ?? ""),
                  order_no: patch.order_no ?? c.order_no,
                  status: (patch.status ?? c.status) as any,
                },
              });
              qc.invalidateQueries({ queryKey: ["admin-courses", programId] });
            }}
            onDelete={() => delMut.mutate(c.id)}
          />
        ))}
      </div>
    </div>
  );
}

function CourseRow({
  course,
  onUpdate,
  onDelete,
}: {
  course: any;
  onUpdate: (patch: Partial<{ slug: string; title: string; description: string; order_no: number; status: string }>) => Promise<void>;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    slug: course.slug,
    title: course.title,
    description: course.description ?? "",
    order_no: course.order_no,
    status: course.status,
  });
  useEffect(() => {
    setForm({
      slug: course.slug,
      title: course.title,
      description: course.description ?? "",
      order_no: course.order_no,
      status: course.status,
    });
  }, [course.id]);

  return (
    <div className="rounded-xl bg-card ring-1 ring-border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">#{course.order_no}</span>
            <h4 className="font-medium text-ink">{course.title}</h4>
            <Badge variant={course.status === "published" ? "default" : "secondary"}>{course.status}</Badge>
          </div>
          <div className="text-xs text-muted-foreground mt-1">/{course.slug}</div>
        </div>
        <div className="flex gap-1 shrink-0">
          <Button variant="ghost" size="sm" onClick={() => setEditing((v) => !v)}>
            <Pencil className="size-3.5" /> {editing ? "Close" : "Edit"}
          </Button>
          <LessonsSheet courseId={course.id} courseTitle={course.title} />
          <FacultySheet courseId={course.id} courseTitle={course.title} />
          <Button variant="ghost" size="sm" className="text-destructive" onClick={onDelete}>
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      {editing && (
        <div className="mt-3 grid sm:grid-cols-2 gap-3 border-t border-border pt-3">
          <div>
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <Label>Slug</Label>
            <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })} />
          </div>
          <div>
            <Label>Order</Label>
            <Input
              type="number"
              value={form.order_no}
              onChange={(e) => setForm({ ...form, order_no: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label>Description</Label>
            <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <Button
              size="sm"
              className="bg-academy text-academy-foreground hover:bg-academy/90"
              onClick={async () => {
                await onUpdate(form);
                toast.success("Course updated");
                setEditing(false);
              }}
            >Save</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ────────── Lessons sheet ──────────
function LessonsSheet({ courseId, courseTitle }: { courseId: string; courseTitle: string }) {
  const fetchLessons = useServerFn(listLessons);
  const saveLesson = useServerFn(upsertLesson);
  const removeLesson = useServerFn(deleteLesson);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const lessonsQ = useQuery({
    queryKey: ["admin-lessons", courseId],
    queryFn: () => fetchLessons({ data: { course_id: courseId } }),
    enabled: open,
  });

  const [editing, setEditing] = useState<any | null>(null);
  const empty = useMemo(
    () => ({
      id: undefined as string | undefined,
      course_id: courseId,
      title: "",
      lesson_type: "reading" as "reading" | "video" | "quiz" | "lab",
      video_url: "",
      content_md: "",
      duration_min: null as number | null,
      order_no: 0,
      preview: false,
      resources: [] as { label: string; url: string }[],
    }),
    [courseId],
  );

  const saveMut = useMutation({
    mutationFn: async (l: any) => saveLesson({ data: l }),
    onSuccess: () => {
      toast.success("Lesson saved");
      qc.invalidateQueries({ queryKey: ["admin-lessons", courseId] });
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => removeLesson({ data: { id } }),
    onSuccess: () => {
      toast.success("Lesson deleted");
      qc.invalidateQueries({ queryKey: ["admin-lessons", courseId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" variant="outline">Lessons</Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader><SheetTitle>{courseTitle} · Lessons</SheetTitle></SheetHeader>
        <div className="mt-4 space-y-2">
          {lessonsQ.data?.map((l: any) => (
            <div key={l.id} className="rounded-lg ring-1 ring-border p-3 flex items-center justify-between">
              <div className="min-w-0">
                <div className="text-sm font-medium text-ink">#{l.order_no} {l.title}</div>
                <div className="text-xs text-muted-foreground">{l.lesson_type}{l.duration_min ? ` · ${l.duration_min} min` : ""}{l.preview ? " · preview" : ""}</div>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => setEditing({ ...l, resources: l.resources ?? [] })}><Pencil className="size-3.5" /></Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => delMut.mutate(l.id)}><Trash2 className="size-3.5" /></Button>
              </div>
            </div>
          ))}
          {lessonsQ.data?.length === 0 && (
            <p className="text-sm text-muted-foreground">No lessons yet.</p>
          )}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setEditing(empty)}
          >
            <Plus className="size-4" /> Add lesson
          </Button>
        </div>

        {editing && (
          <div className="mt-5 border-t border-border pt-4 space-y-3">
            <h4 className="text-sm font-medium">{editing.id ? "Edit lesson" : "New lesson"}</h4>
            <div>
              <Label>Title</Label>
              <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <Select value={editing.lesson_type} onValueChange={(v) => setEditing({ ...editing, lesson_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reading">Reading</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="quiz">Quiz</SelectItem>
                    <SelectItem value="lab">Lab</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Order</Label>
                <Input
                  type="number"
                  value={editing.order_no}
                  onChange={(e) => setEditing({ ...editing, order_no: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Video URL</Label>
                <Input value={editing.video_url ?? ""} onChange={(e) => setEditing({ ...editing, video_url: e.target.value })} />
              </div>
              <div>
                <Label>Duration (min)</Label>
                <Input
                  type="number"
                  value={editing.duration_min ?? ""}
                  onChange={(e) => setEditing({ ...editing, duration_min: e.target.value ? Number(e.target.value) : null })}
                />
              </div>
            </div>
            <div>
              <Label>Content (markdown)</Label>
              <Textarea rows={6} value={editing.content_md ?? ""} onChange={(e) => setEditing({ ...editing, content_md: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={!!editing.preview} onCheckedChange={(v) => setEditing({ ...editing, preview: v })} />
              <Label className="m-0">Preview (free)</Label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <Button
                disabled={!editing.title || saveMut.isPending}
                onClick={() => saveMut.mutate(editing)}
                className="bg-academy text-academy-foreground hover:bg-academy/90"
              >Save lesson</Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ────────── Faculty sheet ──────────
function FacultySheet({ courseId, courseTitle }: { courseId: string; courseTitle: string }) {
  const fetchAssigned = useServerFn(listCourseFaculty);
  const fetchUsers = useServerFn(listUsersWithRoles);
  const assign = useServerFn(assignFaculty);
  const unassign = useServerFn(unassignFaculty);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const assignedQ = useQuery({
    queryKey: ["course-faculty", courseId],
    queryFn: () => fetchAssigned({ data: { course_id: courseId } }),
    enabled: open,
  });
  const facultyQ = useQuery({
    queryKey: ["faculty-pool"],
    queryFn: () => fetchUsers({ data: { role: "faculty" } }),
    enabled: open,
  });

  const assignedIds = new Set((assignedQ.data ?? []).map((r: any) => r.faculty_id));
  const candidates = (facultyQ.data ?? []).filter((u: any) => !assignedIds.has(u.id));

  const assignMut = useMutation({
    mutationFn: async (faculty_id: string) => assign({ data: { course_id: courseId, faculty_id } }),
    onSuccess: () => {
      toast.success("Faculty assigned");
      qc.invalidateQueries({ queryKey: ["course-faculty", courseId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const unassignMut = useMutation({
    mutationFn: async (id: string) => unassign({ data: { id } }),
    onSuccess: () => {
      toast.success("Faculty removed");
      qc.invalidateQueries({ queryKey: ["course-faculty", courseId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" variant="outline"><UserPlus className="size-3.5" /> Faculty</Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader><SheetTitle>{courseTitle} · Faculty</SheetTitle></SheetHeader>
        <div className="mt-4">
          <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Assigned</h4>
          {assignedQ.data?.length === 0 && <p className="text-sm text-muted-foreground">Nobody assigned yet.</p>}
          <ul className="space-y-2">
            {assignedQ.data?.map((r: any) => (
              <li key={r.id} className="flex items-center justify-between rounded-md ring-1 ring-border p-2">
                <div>
                  <div className="text-sm font-medium text-ink">{r.profile?.full_name || "—"}</div>
                  <div className="text-xs text-muted-foreground">{r.profile?.email}</div>
                </div>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => unassignMut.mutate(r.id)}>
                  <X className="size-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-6">
          <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Available faculty</h4>
          {candidates.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No more faculty available. Grant the <strong>faculty</strong> role to a user from{" "}
              <Link to="/dashboard/admin/users" className="text-academy underline">Users & Roles</Link>.
            </p>
          )}
          <ul className="space-y-2">
            {candidates.map((u: any) => (
              <li key={u.id} className="flex items-center justify-between rounded-md ring-1 ring-border p-2">
                <div>
                  <div className="text-sm font-medium text-ink">{u.full_name || "—"}</div>
                  <div className="text-xs text-muted-foreground">{u.email}</div>
                </div>
                <Button size="sm" onClick={() => assignMut.mutate(u.id)} className="bg-academy text-academy-foreground hover:bg-academy/90">
                  Assign
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </SheetContent>
    </Sheet>
  );
}
