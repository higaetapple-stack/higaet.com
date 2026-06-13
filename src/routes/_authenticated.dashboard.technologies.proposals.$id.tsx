import { createFileRoute, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import {
  proposalDetail, upsertProposal, updateProposalStatus,
  upsertProposalVersion, generateProposalPdf, getTechDocSignedUrl,
} from "@/lib/tech-commercial.functions";

export const Route = createFileRoute("/_authenticated/dashboard/technologies/proposals/$id")({
  component: ProposalDetail,
});

const STATUSES = ["draft", "sent", "viewed", "negotiation", "accepted", "rejected", "expired"];

function ProposalDetail() {
  const { id } = useParams({ from: "/_authenticated/dashboard/technologies/proposals/$id" });
  const detailFn = useServerFn(proposalDetail);
  const updateMeta = useServerFn(upsertProposal);
  const updateStatusFn = useServerFn(updateProposalStatus);
  const versionFn = useServerFn(upsertProposalVersion);
  const pdfFn = useServerFn(generateProposalPdf);
  const signFn = useServerFn(getTechDocSignedUrl);
  const qc = useQueryClient();

  const q = useQuery({ queryKey: ["proposal", id], queryFn: () => detailFn({ data: { id } }) });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["proposal", id] });

  const mStatus = useMutation({
    mutationFn: (status: string) => updateStatusFn({ data: { id, status: status as any } }),
    onSuccess: () => { invalidate(); toast.success("Status updated"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const mMeta = useMutation({
    mutationFn: (v: any) => updateMeta({ data: { id, client_id: q.data!.proposal.client_id, title: q.data!.proposal.title, ...v } }),
    onSuccess: invalidate, onError: (e: Error) => toast.error(e.message),
  });

  if (q.isLoading) return <div className="text-muted-foreground">Loading…</div>;
  if (!q.data) return <div className="text-muted-foreground">Not found.</div>;
  const p = q.data.proposal;
  const currentVersion = q.data.versions.find((v: any) => v.version === p.current_version) ?? q.data.versions[0];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{p.client?.company ?? "Proposal"}</div>
        <h2 className="font-display text-2xl font-medium text-ink mt-1">{p.title}</h2>
        <p className="text-sm text-muted-foreground mt-1">v{p.current_version} · created {new Date(p.created_at).toLocaleDateString()}</p>
      </div>

      <div className="ring-1 ring-border rounded-2xl bg-card p-5 grid grid-cols-1 md:grid-cols-3 gap-3">
        <Field label="Status">
          <select value={p.status} onChange={(e) => mStatus.mutate(e.target.value)} className="h-9 rounded ring-1 ring-border px-2 text-sm bg-background w-full">
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Total">
          <input type="number" defaultValue={p.total_amount ?? ""} onBlur={(e) => mMeta.mutate({ total_amount: e.target.value ? Number(e.target.value) : null })} className="h-9 rounded ring-1 ring-border px-2 text-sm bg-background w-full" />
        </Field>
        <Field label="Valid until">
          <input type="date" defaultValue={p.valid_until ?? ""} onChange={(e) => mMeta.mutate({ valid_until: e.target.value || null })} className="h-9 rounded ring-1 ring-border px-2 text-sm bg-background w-full" />
        </Field>
      </div>

      {currentVersion && (
        <VersionEditor
          version={currentVersion}
          proposalId={id}
          onSave={() => invalidate()}
          onGeneratePdf={async () => {
            try {
              await pdfFn({ data: { version_id: currentVersion.id } });
              toast.success("PDF generated");
              invalidate();
            } catch (e: any) { toast.error(e.message); }
          }}
          onDownload={async () => {
            if (!currentVersion.pdf_url) return toast.error("Generate PDF first");
            const { url } = await signFn({ data: { path: currentVersion.pdf_url } });
            window.open(url, "_blank");
          }}
          onDuplicate={async () => {
            try {
              await versionFn({ data: {
                proposal_id: id,
                executive_summary: currentVersion.executive_summary,
                scope_of_work: currentVersion.scope_of_work,
                deliverables: currentVersion.deliverables,
                timeline: currentVersion.timeline,
                pricing: currentVersion.pricing,
                terms: currentVersion.terms,
              } });
              toast.success("New version created");
              invalidate();
            } catch (e: any) { toast.error(e.message); }
          }}
        />
      )}

      <div>
        <h3 className="font-display text-lg mb-2">Version history</h3>
        <ul className="space-y-1 text-sm">
          {q.data.versions.map((v: any) => (
            <li key={v.id} className="flex items-center gap-3 ring-1 ring-border rounded-xl bg-card p-2 px-3">
              <span className="font-medium">v{v.version}</span>
              <span className="text-xs text-muted-foreground">{new Date(v.created_at).toLocaleString()}</span>
              {v.pdf_url && (
                <button onClick={async () => { const { url } = await signFn({ data: { path: v.pdf_url } }); window.open(url, "_blank"); }} className="ml-auto text-xs text-academy hover:underline">Download PDF</button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (<div><div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{label}</div>{children}</div>);
}

function VersionEditor({ version, proposalId, onSave, onGeneratePdf, onDownload, onDuplicate }: {
  version: any; proposalId: string; onSave: () => void;
  onGeneratePdf: () => void; onDownload: () => void; onDuplicate: () => void;
}) {
  const upsert = useServerFn(upsertProposalVersion);
  const [form, setForm] = useState({
    executive_summary: version.executive_summary ?? "",
    scope_of_work: version.scope_of_work ?? "",
    deliverables: version.deliverables ?? "",
    timeline: version.timeline ?? "",
    pricing: version.pricing ?? "",
    terms: version.terms ?? "",
  });
  const m = useMutation({
    mutationFn: () => upsert({ data: { id: version.id, proposal_id: proposalId, ...form } }),
    onSuccess: () => { onSave(); toast.success("Saved"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const sections: Array<[keyof typeof form, string, number]> = [
    ["executive_summary", "Executive Summary", 80],
    ["scope_of_work", "Scope of Work", 120],
    ["deliverables", "Deliverables", 100],
    ["timeline", "Timeline", 80],
    ["pricing", "Pricing", 80],
    ["terms", "Terms & Conditions", 120],
  ];

  return (
    <div className="ring-1 ring-border rounded-2xl bg-card p-5 space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <h3 className="font-display text-lg flex-1">Version {version.version} content</h3>
        <button onClick={() => m.mutate()} className="h-9 px-3 rounded bg-academy text-white text-sm">Save draft</button>
        <button onClick={onGeneratePdf} className="h-9 px-3 rounded ring-1 ring-border text-sm">Generate PDF</button>
        <button onClick={onDownload} className="h-9 px-3 rounded ring-1 ring-border text-sm">Download</button>
        <button onClick={onDuplicate} className="h-9 px-3 rounded ring-1 ring-border text-sm">Duplicate as new version</button>
      </div>
      {sections.map(([key, label, h]) => (
        <div key={key}>
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
          <textarea
            value={form[key]}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            style={{ minHeight: h }}
            className="rounded ring-1 ring-border px-3 py-2 text-sm bg-background w-full"
          />
        </div>
      ))}
    </div>
  );
}
