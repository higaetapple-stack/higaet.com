import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import {
  deleteCertificateTemplate,
  listCertificateTemplates,
  listPrograms,
  listUsersWithRoles,
  upsertCertificateTemplate,
} from "@/lib/admin.functions";
import { adminIssueCertificate, adminListCertificates, adminRevokeCertificate } from "@/lib/academic.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, BadgeCheck, ShieldOff } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/admin/certificates")({
  component: CertificatesPage,
});

function CertificatesPage() {
  const fetchTemplates = useServerFn(listCertificateTemplates);
  const fetchPrograms = useServerFn(listPrograms);
  const save = useServerFn(upsertCertificateTemplate);
  const del = useServerFn(deleteCertificateTemplate);
  const qc = useQueryClient();

  const templatesQ = useQuery({ queryKey: ["admin-cert-templates"], queryFn: () => fetchTemplates() });
  const programsQ = useQuery({ queryKey: ["admin-programs"], queryFn: () => fetchPrograms() });

  const [editing, setEditing] = useState<any | null>(null);

  const saveMut = useMutation({
    mutationFn: async (t: any) => save({ data: t }),
    onSuccess: () => {
      toast.success("Template saved");
      qc.invalidateQueries({ queryKey: ["admin-cert-templates"] });
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const delMut = useMutation({
    mutationFn: async (id: string) => del({ data: { id } }),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-cert-templates"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const programTitle = (id: string) => programsQ.data?.find((p: any) => p.id === id)?.title ?? "—";

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display text-lg font-medium text-ink">Certificate templates</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Define per-program certificate templates. Generation & issuance arrive in Sprint 2C.
          </p>
        </div>
        <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              onClick={() => setEditing({ id: undefined, program_id: programsQ.data?.[0]?.id ?? "", name: "", template_html: "" })}
              className="bg-academy text-academy-foreground hover:bg-academy/90"
            >
              <Plus className="size-4" /> New template
            </Button>
          </DialogTrigger>
          {editing && (
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>{editing.id ? "Edit" : "New"} template</DialogTitle></DialogHeader>
              <div className="grid gap-3">
                <div>
                  <Label>Program</Label>
                  <Select value={editing.program_id} onValueChange={(v) => setEditing({ ...editing, program_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Choose…" /></SelectTrigger>
                    <SelectContent>
                      {programsQ.data?.map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Name</Label>
                  <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                </div>
                <div>
                  <Label>Template HTML</Label>
                  <Textarea
                    rows={10}
                    value={editing.template_html}
                    onChange={(e) => setEditing({ ...editing, template_html: e.target.value })}
                    placeholder={"<div>Awarded to {{student_name}} for completing {{program_title}}.</div>"}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                <Button
                  disabled={!editing.program_id || !editing.name || saveMut.isPending}
                  onClick={() => saveMut.mutate(editing)}
                  className="bg-academy text-academy-foreground hover:bg-academy/90"
                >Save</Button>
              </DialogFooter>
            </DialogContent>
          )}
        </Dialog>
      </div>

      <div className="rounded-xl bg-card ring-1 ring-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Name</th>
              <th className="text-left px-4 py-2 font-medium">Program</th>
              <th className="text-right px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {templatesQ.isLoading && <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>}
            {!templatesQ.isLoading && templatesQ.data?.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-10 text-center text-muted-foreground">No templates yet.</td></tr>
            )}
            {templatesQ.data?.map((t: any) => (
              <tr key={t.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium text-ink">{t.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{programTitle(t.program_id)}</td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="sm" onClick={() => setEditing({ ...t })}>
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => delMut.mutate(t.id)}>
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
