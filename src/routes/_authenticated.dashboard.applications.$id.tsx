import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getMyApplication, updateMyApplication, addApplicationDocument, deleteApplicationDocument } from "@/lib/study-abroad.functions";

export const Route = createFileRoute("/_authenticated/dashboard/applications/$id")({
  component: ApplicationDetail,
});

const STATUS_FLOW = [
  { v: "lead", l: "Lead" },
  { v: "counseling", l: "Counselling" },
  { v: "started", l: "Started" },
  { v: "docs_submitted", l: "Documents submitted" },
  { v: "submitted", l: "Submitted" },
];

const DOC_TYPES = [
  ["passport", "Passport"], ["transcript", "Transcript"], ["resume", "Resume"],
  ["sop", "SOP"], ["lor", "LOR"], ["english_test", "English test score"],
  ["financial", "Financial"], ["other", "Other"],
] as const;

function ApplicationDetail() {
  const { id } = Route.useParams();
  const fetcher = useServerFn(getMyApplication);
  const updateFn = useServerFn(updateMyApplication);
  const addDoc = useServerFn(addApplicationDocument);
  const delDoc = useServerFn(deleteApplicationDocument);
  const qc = useQueryClient();

  const q = useQuery({ queryKey: ["my-application", id], queryFn: () => fetcher({ data: { id } }) });
  const [notes, setNotes] = useState("");
  const [intake, setIntake] = useState("");
  const [docType, setDocType] = useState<string>("transcript");
  const [docUrl, setDocUrl] = useState("");
  const [docName, setDocName] = useState("");

  const update = useMutation({
    mutationFn: (patch: any) => updateFn({ data: { id, ...patch } }),
    onSuccess: () => { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["my-application", id] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const addDocM = useMutation({
    mutationFn: () => addDoc({ data: { application_id: id, doc_type: docType as any, file_url: docUrl, file_name: docName || undefined } }),
    onSuccess: () => { toast.success("Document added"); setDocUrl(""); setDocName(""); qc.invalidateQueries({ queryKey: ["my-application", id] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const removeDoc = useMutation({
    mutationFn: (docId: string) => delDoc({ data: { id: docId } }),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["my-application", id] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (q.isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!q.data) return <p>Application not found.</p>;
  const { application: a, documents } = q.data;

  return (
    <div className="max-w-5xl">
      <Link to="/dashboard/applications" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-ink mb-4"><ArrowLeft className="size-3" /> All applications</Link>
      <h1 className="font-display text-2xl text-ink">{a.universities?.countries?.flag_emoji} {a.universities?.name}</h1>
      <p className="text-sm text-muted-foreground mt-1">{a.university_programs?.name ?? "Program undecided"} · {a.intake ?? "Intake TBD"}</p>

      <div className="grid lg:grid-cols-[2fr_1fr] gap-6 mt-6">
        <div className="space-y-6">
          {/* Timeline */}
          <div className="rounded-2xl ring-1 ring-border bg-card p-5">
            <h2 className="font-medium text-ink mb-4">Application timeline</h2>
            <ol className="space-y-2">
              {STATUS_FLOW.map((s) => {
                const ai = STATUS_FLOW.findIndex((x) => x.v === a.status);
                const i = STATUS_FLOW.findIndex((x) => x.v === s.v);
                const done = i <= ai;
                return (
                  <li key={s.v} className="flex items-center gap-3">
                    <span className={`size-2.5 rounded-full ${done ? "bg-global" : "bg-muted"}`} />
                    <span className={`text-sm ${done ? "text-ink" : "text-muted-foreground"}`}>{s.l}</span>
                    {a.status === s.v && i < STATUS_FLOW.length - 1 && (
                      <Button size="sm" variant="ghost" onClick={() => update.mutate({ status: STATUS_FLOW[i + 1].v })}>Advance →</Button>
                    )}
                  </li>
                );
              })}
              {a.status === "offer" && <li className="text-sm text-global font-medium">🎉 Offer received</li>}
            </ol>
          </div>

          {/* Documents */}
          <div className="rounded-2xl ring-1 ring-border bg-card p-5">
            <h2 className="font-medium text-ink mb-4">Documents</h2>
            <ul className="divide-y divide-border mb-4">
              {documents.map((d: any) => (
                <li key={d.id} className="py-2 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-ink">{d.file_name ?? d.doc_type} <span className="text-xs text-muted-foreground">· v{d.version} · {d.doc_type}</span></div>
                    <a href={d.file_url} target="_blank" rel="noreferrer" className="text-xs text-global">View file</a>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => confirm("Delete?") && removeDoc.mutate(d.id)}><Trash2 className="size-3.5" /></Button>
                </li>
              ))}
              {documents.length === 0 && <li className="py-4 text-sm text-muted-foreground text-center">No documents yet.</li>}
            </ul>
            <div className="grid sm:grid-cols-2 gap-2">
              <select value={docType} onChange={(e) => setDocType(e.target.value)} className="h-10 rounded-md ring-1 ring-border px-3 text-sm bg-background">
                {DOC_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <Input value={docName} onChange={(e) => setDocName(e.target.value)} placeholder="File name (optional)" />
              <Input value={docUrl} onChange={(e) => setDocUrl(e.target.value)} placeholder="File URL (paste hosted link)" className="sm:col-span-2" />
              <Button onClick={() => addDocM.mutate()} disabled={!docUrl || addDocM.isPending} className="sm:col-span-2 bg-global text-white hover:bg-global/90">
                <Upload className="size-4" /> Add document
              </Button>
            </div>
          </div>
        </div>

        {/* Edit panel */}
        <aside className="rounded-2xl ring-1 ring-border bg-card p-5 space-y-3 h-fit">
          <div><Label className="text-xs">Preferred intake</Label><Input defaultValue={a.intake ?? ""} onChange={(e) => setIntake(e.target.value)} placeholder="e.g. Fall 2026" /></div>
          <div><Label className="text-xs">Notes</Label><Textarea defaultValue={a.notes ?? ""} rows={4} onChange={(e) => setNotes(e.target.value)} /></div>
          <Button onClick={() => update.mutate({ intake: intake || undefined, notes: notes || undefined })} className="w-full bg-global text-white hover:bg-global/90">Save</Button>
        </aside>
      </div>
    </div>
  );
}
