import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import {
  createProgram,
  deleteProgram,
  listPrograms,
  programCategories,
  type ProgramCategory,
  type ProgramStatus,
} from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/admin/programs")({
  component: ProgramsPage,
});

const STATUS_LABEL: Record<ProgramStatus, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

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

function ProgramsPage() {
  const fetchPrograms = useServerFn(listPrograms);
  const removeProgram = useServerFn(deleteProgram);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-programs"], queryFn: () => fetchPrograms() });

  const del = useMutation({
    mutationFn: async (id: string) => removeProgram({ data: { id } }),
    onSuccess: () => {
      toast.success("Program deleted");
      qc.invalidateQueries({ queryKey: ["admin-programs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display text-lg font-medium text-ink">Programs</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Flagship programs are the top of the academy hierarchy. Each contains courses, lessons, faculty, and certificates.
          </p>
        </div>
        <NewProgramDialog />
      </div>

      <div className="rounded-xl bg-card ring-1 ring-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Title</th>
              <th className="text-left px-4 py-2 font-medium">Category</th>
              <th className="text-left px-4 py-2 font-medium">Status</th>
              <th className="text-left px-4 py-2 font-medium">Featured</th>
              <th className="text-right px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading…</td>
              </tr>
            )}
            {!isLoading && (data?.length ?? 0) === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  No programs yet. Click <strong>New Program</strong> to create one.
                </td>
              </tr>
            )}
            {data?.map((p: any) => (
              <tr key={p.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <Link
                    to="/dashboard/admin/programs/$id"
                    params={{ id: p.id }}
                    className="font-medium text-ink hover:text-academy"
                  >
                    {p.title}
                  </Link>
                  <div className="text-xs text-muted-foreground mt-0.5">/{p.slug}</div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {CATEGORY_LABEL[p.category as ProgramCategory] ?? p.category}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={p.status === "published" ? "default" : "secondary"}>
                    {STATUS_LABEL[p.status as ProgramStatus] ?? p.status}
                  </Badge>
                </td>
                <td className="px-4 py-3">{p.featured ? "★" : "—"}</td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-1">
                    <Button asChild size="sm" variant="ghost">
                      <Link to="/dashboard/admin/programs/$id" params={{ id: p.id }}>
                        <Pencil className="size-3.5" /> Edit
                      </Link>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="text-destructive">
                          <Trash2 className="size-3.5" /> Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete "{p.title}"?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This permanently removes the program, its courses, lessons, assignments, and enrollments.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => del.mutate(p.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NewProgramDialog() {
  const [open, setOpen] = useState(false);
  const create = useServerFn(createProgram);
  const qc = useQueryClient();
  const [form, setForm] = useState({
    slug: "",
    title: "",
    category: "ai_engineering" as ProgramCategory,
    level: "",
    format: "",
    duration: "",
    fee_inr: "",
    description: "",
    thumbnail_url: "",
    status: "draft" as ProgramStatus,
    featured: false,
  });

  const mut = useMutation({
    mutationFn: async () => create({ data: form }),
    onSuccess: () => {
      toast.success("Program created");
      qc.invalidateQueries({ queryKey: ["admin-programs"] });
      setOpen(false);
      setForm((f) => ({ ...f, slug: "", title: "", description: "" }));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-academy text-academy-foreground hover:bg-academy/90">
          <Plus className="size-4" /> New Program
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create program</DialogTitle>
          <DialogDescription>Start with the basics — you can edit details after creation.</DialogDescription>
        </DialogHeader>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <Label>Slug</Label>
            <Input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })}
              placeholder="ai-engineering"
            />
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
            <Input value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} placeholder="Beginner / Advanced" />
          </div>
          <div>
            <Label>Format</Label>
            <Input value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })} placeholder="Online / Hybrid" />
          </div>
          <div>
            <Label>Duration</Label>
            <Input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="6 months" />
          </div>
          <div>
            <Label>Fee (INR)</Label>
            <Input value={form.fee_inr} onChange={(e) => setForm({ ...form, fee_inr: e.target.value })} placeholder="₹1,20,000" />
          </div>
          <div className="sm:col-span-2">
            <Label>Description</Label>
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Thumbnail URL</Label>
            <Input
              value={form.thumbnail_url}
              onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })}
              placeholder="https://…"
            />
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
          <div className="flex items-end gap-3">
            <div className="flex items-center gap-2">
              <Switch checked={form.featured} onCheckedChange={(v) => setForm({ ...form, featured: v })} />
              <Label className="m-0">Featured</Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            onClick={() => mut.mutate()}
            disabled={mut.isPending || !form.title || !form.slug}
            className="bg-academy text-academy-foreground hover:bg-academy/90"
          >
            {mut.isPending ? "Creating…" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
