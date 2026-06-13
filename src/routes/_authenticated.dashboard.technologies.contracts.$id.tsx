import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import {
  contractDetail, upsertContract, updateContractStatus, generateContractPdf,
  getTechDocSignedUrl, addContractDocument, deleteContractDocument, createProjectFromContract,
} from "@/lib/tech-commercial.functions";

export const Route = createFileRoute("/_authenticated/dashboard/technologies/contracts/$id")({
  component: ContractDetail,
});

const STATUSES = ["draft", "sent", "signed", "active", "completed", "terminated"];
const SECTIONS: Array<[string, string, number]> = [
  ["parties", "Parties", 80],
  ["scope", "Scope of Work", 120],
  ["deliverables", "Deliverables", 100],
  ["payment_terms", "Payment Terms", 80],
  ["confidentiality", "Confidentiality", 80],
  ["termination", "Termination", 80],
];

function ContractDetail() {
  const { id } = useParams({ from: "/_authenticated/dashboard/technologies/contracts/$id" });
  const detailFn = useServerFn(contractDetail);
  const updateFn = useServerFn(upsertContract);
  const statusFn = useServerFn(updateContractStatus);
  const pdfFn = useServerFn(generateContractPdf);
  const signFn = useServerFn(getTechDocSignedUrl);
  const createProjFn = useServerFn(createProjectFromContract);
  const qc = useQueryClient();
  const navigate = useNavigate();

  const q = useQuery({ queryKey: ["contract", id], queryFn: () => detailFn({ data: { id } }) });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["contract", id] });

  const mStatus = useMutation({
    mutationFn: (status: string) => statusFn({ data: { id, status: status as any } }),
    onSuccess: () => { invalidate(); toast.success("Status updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const mCreateProject = useMutation({
    mutationFn: () => createProjFn({ data: { contract_id: id } }),
    onSuccess: (r) => { toast.success("Project created"); navigate({ to: "/dashboard/technologies/projects/$id", params: { id: r.project_id } }); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (q.isLoading) return <div className="text-muted-foreground">Loading…</div>;
  if (!q.data) return <div className="text-muted-foreground">Not found.</div>;
  const c = q.data.contract;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{c.client?.company ?? "Contract"}</div>
          <h2 className="font-display text-2xl font-medium text-ink mt-1">{c.title}</h2>
          {c.proposal && (
            <Link to="/dashboard/technologies/proposals/$id" params={{ id: c.proposal.id }} className="text-xs text-academy hover:underline">
              from proposal: {c.proposal.title}
            </Link>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <select value={c.status} onChange={(e) => mStatus.mutate(e.target.value)} className="h-9 rounded ring-1 ring-border px-2 text-sm bg-background">
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          {(c.status === "signed" || c.status === "active") && !c.project_id && (
            <button onClick={() => mCreateProject.mutate()} className="h-9 px-3 rounded bg-academy text-white text-sm">Create project from contract</button>
          )}
          {c.project_id && c.project && (
            <Link to="/dashboard/technologies/projects/$id" params={{ id: c.project_id }} className="h-9 px-3 rounded ring-1 ring-border text-sm flex items-center">
              Open project →
            </Link>
          )}
        </div>
      </div>

      <ContractEditor contract={c} onSave={invalidate} onGeneratePdf={async () => {
        try { await pdfFn({ data: { id } }); toast.success("PDF generated"); invalidate(); } catch (e: any) { toast.error(e.message); }
      }} onDownload={async () => {
        if (!c.pdf_url) return toast.error("Generate PDF first");
        const { url } = await signFn({ data: { path: c.pdf_url } });
        window.open(url, "_blank");
      }} />

      <ContractDocsSection contractId={id} documents={q.data.documents} onChange={invalidate} signFn={signFn} />
    </div>
  );
}

function ContractEditor({ contract, onSave, onGeneratePdf, onDownload }: { contract: any; onSave: () => void; onGeneratePdf: () => void; onDownload: () => void; }) {
  const updateFn = useServerFn(upsertContract);
  const [form, setForm] = useState<any>({
    effective_date: contract.effective_date ?? "",
    end_date: contract.end_date ?? "",
    total_amount: contract.total_amount ?? "",
    currency: contract.currency ?? "USD",
    parties: contract.parties ?? "",
    scope: contract.scope ?? "",
    deliverables: contract.deliverables ?? "",
    payment_terms: contract.payment_terms ?? "",
    confidentiality: contract.confidentiality ?? "",
    termination: contract.termination ?? "",
  });
  const m = useMutation({
    mutationFn: () => updateFn({ data: {
      id: contract.id, client_id: contract.client_id, title: contract.title,
      ...form,
      total_amount: form.total_amount ? Number(form.total_amount) : null,
      effective_date: form.effective_date || null, end_date: form.end_date || null,
    } }),
    onSuccess: () => { onSave(); toast.success("Saved"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="ring-1 ring-border rounded-2xl bg-card p-5 space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <h3 className="font-display text-lg flex-1">Contract content</h3>
        <button onClick={() => m.mutate()} className="h-9 px-3 rounded bg-academy text-white text-sm">Save</button>
        <button onClick={onGeneratePdf} className="h-9 px-3 rounded ring-1 ring-border text-sm">Generate PDF</button>
        <button onClick={onDownload} className="h-9 px-3 rounded ring-1 ring-border text-sm">Download</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Field label="Effective"><input type="date" value={form.effective_date} onChange={(e) => setForm({ ...form, effective_date: e.target.value })} className="h-9 rounded ring-1 ring-border px-2 text-sm bg-background w-full" /></Field>
        <Field label="End"><input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="h-9 rounded ring-1 ring-border px-2 text-sm bg-background w-full" /></Field>
        <Field label="Total"><input type="number" value={form.total_amount} onChange={(e) => setForm({ ...form, total_amount: e.target.value })} className="h-9 rounded ring-1 ring-border px-2 text-sm bg-background w-full" /></Field>
        <Field label="Currency"><input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="h-9 rounded ring-1 ring-border px-2 text-sm bg-background w-full" /></Field>
      </div>
      {SECTIONS.map(([k, label, h]) => (
        <div key={k}>
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
          <textarea value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} style={{ minHeight: h }} className="rounded ring-1 ring-border px-3 py-2 text-sm bg-background w-full" />
        </div>
      ))}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (<div><div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{label}</div>{children}</div>);
}

function ContractDocsSection({ contractId, documents, onChange, signFn }: { contractId: string; documents: any[]; onChange: () => void; signFn: any }) {
  const addFn = useServerFn(addContractDocument);
  const delFn = useServerFn(deleteContractDocument);
  const mAdd = useMutation({ mutationFn: (v: any) => addFn({ data: v }), onSuccess: () => { onChange(); toast.success("Added"); }, onError: (e: Error) => toast.error(e.message) });
  const mDel = useMutation({ mutationFn: (id: string) => delFn({ data: { id } }), onSuccess: onChange });
  const [form, setForm] = useState({ document_type: "Attachment", file_url: "", file_name: "", visible_to_client: true });

  return (
    <div className="space-y-3">
      <h3 className="font-display text-lg">Contract documents</h3>
      <div className="ring-1 ring-border rounded-2xl bg-card p-4 grid grid-cols-1 md:grid-cols-2 gap-2">
        <input placeholder="Type" value={form.document_type} onChange={(e) => setForm({ ...form, document_type: e.target.value })} className="h-9 rounded ring-1 ring-border px-3 text-sm bg-background" />
        <input placeholder="File name" value={form.file_name} onChange={(e) => setForm({ ...form, file_name: e.target.value })} className="h-9 rounded ring-1 ring-border px-3 text-sm bg-background" />
        <input placeholder="File URL" value={form.file_url} onChange={(e) => setForm({ ...form, file_url: e.target.value })} className="h-9 rounded ring-1 ring-border px-3 text-sm bg-background md:col-span-2" />
        <label className="text-xs flex items-center gap-2 text-muted-foreground">
          <input type="checkbox" checked={form.visible_to_client} onChange={(e) => setForm({ ...form, visible_to_client: e.target.checked })} /> Visible to client
        </label>
        <button onClick={() => {
          if (!form.file_url) return toast.error("File URL required");
          mAdd.mutate({ contract_id: contractId, ...form });
          setForm({ document_type: "Attachment", file_url: "", file_name: "", visible_to_client: true });
        }} className="h-9 px-3 rounded bg-academy text-white text-sm">Add document</button>
      </div>
      <ul className="space-y-2">
        {documents.map((d: any) => (
          <li key={d.id} className="ring-1 ring-border rounded-xl bg-card p-3 flex items-center gap-3">
            <div className="flex-1">
              <div className="text-ink text-sm">{d.file_name ?? d.file_url} {d.visible_to_client && <span className="text-xs text-green-600">· shared</span>}</div>
              <a href={d.file_url} target="_blank" rel="noreferrer" className="text-xs text-academy hover:underline">{d.document_type ?? "Document"}</a>
            </div>
            <button onClick={() => mDel.mutate(d.id)} className="text-xs text-red-600 px-2 h-8 rounded ring-1 ring-border">Delete</button>
          </li>
        ))}
        {documents.length === 0 && <li className="text-sm text-muted-foreground">No documents yet.</li>}
      </ul>
    </div>
  );
}
