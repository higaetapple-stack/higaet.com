import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { myVisaCases, visaCaseDetail, addVisaDocument } from "@/lib/visa.functions";

export const Route = createFileRoute("/_authenticated/dashboard/visa")({
  component: StudentVisa,
});

const DOC_TYPES = [
  "passport",
  "offer_letter",
  "financial_proof",
  "medical",
  "visa_form",
  "photo",
  "english_test",
  "other",
];

const REQUIRED_DOCS = ["passport", "offer_letter", "financial_proof", "visa_form", "photo"];

function StudentVisa() {
  const listFn = useServerFn(myVisaCases);
  const cases = useQuery({ queryKey: ["student-visa-cases"], queryFn: () => listFn() });
  const [selected, setSelected] = useState<string | null>(null);

  const current = selected ?? cases.data?.[0]?.id ?? null;

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-medium text-ink">My visa</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track your visa status, documents, and interview details.
        </p>
      </div>

      {cases.isLoading && <div className="text-muted-foreground">Loading…</div>}
      {!cases.isLoading && (cases.data ?? []).length === 0 && (
        <div className="ring-1 ring-border rounded-2xl bg-card p-6 text-sm text-muted-foreground">
          You don't have any visa cases yet. Your counselor will create one once your application moves to the visa stage.
        </div>
      )}

      {(cases.data ?? []).length > 1 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {(cases.data ?? []).map((c: any) => (
            <button
              key={c.id}
              onClick={() => setSelected(c.id)}
              className={`px-3 h-9 rounded text-sm ring-1 ring-border ${current === c.id ? "bg-academy text-white" : "bg-background"}`}
            >
              {c.countries?.flag_emoji} {c.countries?.name ?? "Visa"}
            </button>
          ))}
        </div>
      )}

      {current && <CaseView id={current} />}
    </div>
  );
}

function CaseView({ id }: { id: string }) {
  const detail = useServerFn(visaCaseDetail);
  const addDoc = useServerFn(addVisaDocument);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["student-visa-case", id], queryFn: () => detail({ data: { id } }) });
  const m = useMutation({
    mutationFn: (v: any) => addDoc({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["student-visa-case", id] });
      toast.success("Document uploaded");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [docType, setDocType] = useState("passport");
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");

  if (q.isLoading) return <div className="text-muted-foreground">Loading…</div>;
  if (!q.data) return null;
  const c = q.data.case;
  const uploadedTypes = new Set((q.data.documents ?? []).map((d: any) => d.document_type));

  return (
    <div className="space-y-6">
      <div className="ring-1 ring-border rounded-2xl bg-card p-5">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Status</div>
        <div className="text-xl font-medium text-ink mt-1">{c.status.replace(/_/g, " ")}</div>
        {c.interview_date && (
          <div className="mt-3 text-sm">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Interview</div>
            <div className="text-ink">
              {c.interview_date} {c.interview_time ?? ""} · {c.interview_location ?? "TBD"}
            </div>
            {c.interview_notes && (
              <div className="text-xs text-muted-foreground mt-1">{c.interview_notes}</div>
            )}
          </div>
        )}
      </div>

      <div className="ring-1 ring-border rounded-2xl bg-card p-5">
        <h3 className="font-display text-lg font-medium text-ink mb-3">Required documents</h3>
        <ul className="space-y-1 mb-4">
          {REQUIRED_DOCS.map((d) => (
            <li key={d} className="text-sm flex items-center gap-2">
              <span className={uploadedTypes.has(d) ? "text-green-600" : "text-muted-foreground"}>
                {uploadedTypes.has(d) ? "✓" : "○"}
              </span>
              <span className="text-ink">{d.replace(/_/g, " ")}</span>
            </li>
          ))}
        </ul>

        <div className="grid sm:grid-cols-4 gap-2 mb-2">
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="h-9 rounded ring-1 ring-border px-2 text-sm bg-background"
          >
            {DOC_TYPES.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <input
            placeholder="File URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="h-9 rounded ring-1 ring-border px-2 text-sm bg-background sm:col-span-2"
          />
          <input
            placeholder="File name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-9 rounded ring-1 ring-border px-2 text-sm bg-background"
          />
        </div>
        <button
          onClick={() => {
            if (!url) return toast.error("File URL required");
            m.mutate({ visa_case_id: id, document_type: docType, file_url: url, file_name: name || undefined });
            setUrl("");
            setName("");
          }}
          className="h-9 px-3 rounded bg-academy text-white text-sm"
        >
          Upload document
        </button>

        <ul className="space-y-2 mt-4">
          {q.data.documents.map((d: any) => (
            <li key={d.id} className="ring-1 ring-border rounded-xl p-3 bg-background flex items-center gap-3">
              <div className="flex-1">
                <div className="text-sm text-ink">
                  {d.document_type} {d.verified && <span className="text-xs text-green-600">✓ verified</span>}
                </div>
                <a href={d.file_url} target="_blank" rel="noreferrer" className="text-xs text-academy hover:underline">
                  {d.file_name ?? d.file_url}
                </a>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="ring-1 ring-border rounded-2xl bg-card p-5">
        <h3 className="font-display text-lg font-medium text-ink mb-3">Timeline</h3>
        <ul className="space-y-3">
          {q.data.history.map((h: any) => (
            <li key={h.id} className="text-sm">
              <div className="text-ink">
                {h.old_status ?? "—"} → <span className="font-medium">{h.new_status}</span>
              </div>
              <div className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleString()}</div>
              {h.notes && <div className="text-xs text-muted-foreground mt-1">{h.notes}</div>}
            </li>
          ))}
          {q.data.history.length === 0 && (
            <li className="text-sm text-muted-foreground">No updates yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
