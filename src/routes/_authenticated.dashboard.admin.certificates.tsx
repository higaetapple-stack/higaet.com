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
import { adminRegenerateCertificatePdf, getCertificateDownloadUrl } from "@/lib/certificates.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, BadgeCheck, ShieldOff, Download, RefreshCw, Link2 } from "lucide-react";

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
    <Tabs defaultValue="issued">
      <TabsList>
        <TabsTrigger value="issued">Issued certificates</TabsTrigger>
        <TabsTrigger value="templates">Templates</TabsTrigger>
      </TabsList>

      <TabsContent value="issued" className="mt-4">
        <IssuedTab programs={programsQ.data ?? []} />
      </TabsContent>

      <TabsContent value="templates" className="mt-4">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-lg font-medium text-ink">Certificate templates</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Define per-program certificate templates used at issuance.
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
      </TabsContent>
    </Tabs>
  );
}

function IssuedTab({ programs }: { programs: any[] }) {
  const list = useServerFn(adminListCertificates);
  const issue = useServerFn(adminIssueCertificate);
  const revoke = useServerFn(adminRevokeCertificate);
  const listUsers = useServerFn(listUsersWithRoles);
  const qc = useQueryClient();

  const q = useQuery({ queryKey: ["admin-certificates"], queryFn: () => list() });
  const usersQ = useQuery({ queryKey: ["admin-users", "student"], queryFn: () => listUsers({ data: { role: "student" as const } }) });

  const [open, setOpen] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [programId, setProgramId] = useState("");
  const [force, setForce] = useState(false);

  const issueMut = useMutation({
    mutationFn: () => issue({ data: { student_id: studentId, program_id: programId, force } }),
    onSuccess: () => {
      toast.success("Certificate issued");
      qc.invalidateQueries({ queryKey: ["admin-certificates"] });
      setOpen(false);
      setStudentId(""); setProgramId(""); setForce(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const revokeMut = useMutation({
    mutationFn: (id: string) => revoke({ data: { id, reason: "Admin revocation" } }),
    onSuccess: () => {
      toast.success("Revoked");
      qc.invalidateQueries({ queryKey: ["admin-certificates"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display text-lg font-medium text-ink">Issued certificates</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Manually issue or revoke certificates.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-academy text-academy-foreground hover:bg-academy/90">
              <BadgeCheck className="size-4" /> Issue certificate
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Issue certificate</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div>
                <Label>Student</Label>
                <Select value={studentId} onValueChange={setStudentId}>
                  <SelectTrigger><SelectValue placeholder="Choose student" /></SelectTrigger>
                  <SelectContent>
                    {(usersQ.data ?? []).map((u: any) => (
                      <SelectItem key={u.id} value={u.id}>{u.full_name || u.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Program</Label>
                <Select value={programId} onValueChange={setProgramId}>
                  <SelectTrigger><SelectValue placeholder="Choose program" /></SelectTrigger>
                  <SelectContent>
                    {programs.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input type="checkbox" checked={force} onChange={(e) => setForce(e.target.checked)} />
                Force-issue (skip eligibility check)
              </label>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button
                disabled={!studentId || !programId || issueMut.isPending}
                onClick={() => issueMut.mutate()}
                className="bg-academy text-academy-foreground hover:bg-academy/90"
              >
                {issueMut.isPending ? "Issuing…" : "Issue"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl bg-card ring-1 ring-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Student</th>
              <th className="text-left px-4 py-2 font-medium">Program</th>
              <th className="text-left px-4 py-2 font-medium">Number</th>
              <th className="text-left px-4 py-2 font-medium">Issued</th>
              <th className="text-right px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {q.isLoading && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>}
            {!q.isLoading && (q.data ?? []).length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No certificates issued yet.</td></tr>
            )}
            {(q.data ?? []).map((c: any) => (
              <tr key={c.id} className="border-t border-border">
                <td className="px-4 py-3 text-ink">{c.profiles?.full_name ?? c.profiles?.email}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.programs?.title}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{c.certificate_number}</td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(c.issued_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">
                  {c.revoked ? (
                    <Badge variant="destructive">Revoked</Badge>
                  ) : (
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => confirm("Revoke this certificate?") && revokeMut.mutate(c.id)}>
                      <ShieldOff className="size-3.5" /> Revoke
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
