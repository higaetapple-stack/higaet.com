import { createFileRoute, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import {
  visaCaseDetail,
  updateVisaCase,
  verifyVisaDocument,
  deleteVisaDocument,
  addVisaDocument,
} from "@/lib/visa.functions";

export const Route = createFileRoute("/_authenticated/dashboard/admin/visa/$id")({
  component: VisaDetail,
});

const STATUSES = [
  "draft",
  "documents_pending",
  "ready_to_submit",
  "submitted",
  "interview_scheduled",
  "administrative_processing",
  "approved",
  "rejected",
  "closed",
];
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

function VisaDetail() {
  const { id } = useParams({ from: "/_authenticated/dashboard/admin/visa/$id" });
  const detail = useServerFn(visaCaseDetail);
  const update = useServerFn(updateVisaCase);
  const verify = useServerFn(verifyVisaDocument);
  const delDoc = useServerFn(deleteVisaDocument);
  const addDoc = useServerFn(addVisaDocument);
  const qc = useQueryClient();

  const q = useQuery({ queryKey: ["visa-case", id], queryFn: () => detail({ data: { id } }) });
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["visa-case", id] });
    qc.invalidateQueries({ queryKey: ["visa-kpis"] });
    qc.invalidateQueries({ queryKey: ["visa-list"] });
  };

  const mUpdate = useMutation({
    mutationFn: (v: any) => update({ data: { id, ...v } }),
    onSuccess: () => {
      invalidate();
      toast.success("Updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const mVerify = useMutation({
    mutationFn: (v: { id: string; verified: boolean }) => verify({ data: v }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });
  const mDelDoc = useMutation({
    mutationFn: (docId: string) => delDoc({ data: { id: docId } }),
    onSuccess: invalidate,
  });
  const mAddDoc = useMutation({
    mutationFn: (v: any) => addDoc({ data: v }),
    onSuccess: () => {
      invalidate();
      toast.success("Document added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [docType, setDocType] = useState("passport");
  const [docUrl, setDocUrl] = useState("");
  const [docName, setDocName] = useState("");

  if (q.isLoading) return <div className="text-muted-foreground">Loading…</div>;
  if (!q.data) return <div className="text-muted-foreground">Not found.</div>;
  const c = q.data.case;

  return (
    <div className="grid lg:grid-cols-[1fr,360px] gap-6">
      <div className="space-y-6">
        <div className="ring-1 ring-border rounded-2xl bg-card p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Visa case</div>
          <h2 className="font-display text-xl font-medium text-ink mt-1">
            {c.student?.full_name ?? "Student"} · {c.countries?.flag_emoji} {c.countries?.name ?? ""}
          </h2>
          <div className="text-xs text-muted-foreground mt-1">{c.student?.email}</div>

          <div className="grid sm:grid-cols-2 gap-3 mt-4">
            <Field label="Status">
              <select
                value={c.status}
                onChange={(e) => mUpdate.mutate({ status: e.target.value })}
                className="h-9 rounded ring-1 ring-border px-2 text-sm bg-background w-full"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Visa type">
              <input
                defaultValue={c.visa_type ?? ""}
                onBlur={(e) => e.target.value !== (c.visa_type ?? "") && mUpdate.mutate({ visa_type: e.target.value })}
                className="h-9 rounded ring-1 ring-border px-2 text-sm bg-background w-full"
              />
            </Field>
            <Field label="Interview date">
              <input
                type="date"
                defaultValue={c.interview_date ?? ""}
                onChange={(e) => mUpdate.mutate({ interview_date: e.target.value || null })}
                className="h-9 rounded ring-1 ring-border px-2 text-sm bg-background w-full"
              />
            </Field>
            <Field label="Interview time">
              <input
                type="time"
                defaultValue={c.interview_time ?? ""}
                onChange={(e) => mUpdate.mutate({ interview_time: e.target.value || null })}
                className="h-9 rounded ring-1 ring-border px-2 text-sm bg-background w-full"
              />
            </Field>
            <Field label="Interview location" wide>
              <input
                defaultValue={c.interview_location ?? ""}
                onBlur={(e) => mUpdate.mutate({ interview_location: e.target.value || null })}
                className="h-9 rounded ring-1 ring-border px-2 text-sm bg-background w-full"
              />
            </Field>
            <Field label="Notes" wide>
              <textarea
                defaultValue={c.notes ?? ""}
                onBlur={(e) => mUpdate.mutate({ notes: e.target.value || null })}
                className="rounded ring-1 ring-border px-2 py-2 text-sm bg-background w-full min-h-[80px]"
              />
            </Field>
          </div>
        </div>

        <div className="ring-1 ring-border rounded-2xl bg-card p-5">
          <h3 className="font-display text-lg font-medium text-ink mb-3">Documents</h3>
          <div className="grid sm:grid-cols-4 gap-2 mb-3">
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="h-9 rounded ring-1 ring-border px-2 text-sm bg-background"
            >
              {DOC_TYPES.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <input
              placeholder="File URL"
              value={docUrl}
              onChange={(e) => setDocUrl(e.target.value)}
              className="h-9 rounded ring-1 ring-border px-2 text-sm bg-background sm:col-span-2"
            />
            <input
              placeholder="File name"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              className="h-9 rounded ring-1 ring-border px-2 text-sm bg-background"
            />
          </div>
          <button
            onClick={() => {
              if (!docUrl) return toast.error("File URL required");
              mAddDoc.mutate({
                visa_case_id: id,
                document_type: docType,
                file_url: docUrl,
                file_name: docName || undefined,
              });
              setDocUrl("");
              setDocName("");
            }}
            className="h-9 px-3 rounded bg-academy text-white text-sm mb-4"
          >
            Add document
          </button>

          <ul className="space-y-2">
            {q.data.documents.map((d: any) => (
              <li
                key={d.id}
                className="ring-1 ring-border rounded-xl p-3 flex items-center gap-3 bg-background"
              >
                <div className="flex-1">
                  <div className="text-ink text-sm">
                    {d.document_type} {d.verified && <span className="text-xs text-green-600">✓ verified</span>}
                  </div>
                  <a href={d.file_url} target="_blank" rel="noreferrer" className="text-xs text-academy hover:underline">
                    {d.file_name ?? d.file_url}
                  </a>
                </div>
                <button
                  onClick={() => mVerify.mutate({ id: d.id, verified: !d.verified })}
                  className="text-xs px-2 h-8 rounded ring-1 ring-border"
                >
                  {d.verified ? "Unverify" : "Verify"}
                </button>
                <button
                  onClick={() => mDelDoc.mutate(d.id)}
                  className="text-xs px-2 h-8 rounded ring-1 ring-border text-red-600"
                >
                  Delete
                </button>
              </li>
            ))}
            {q.data.documents.length === 0 && (
              <li className="text-sm text-muted-foreground">No documents.</li>
            )}
          </ul>
        </div>
      </div>

      <div className="ring-1 ring-border rounded-2xl bg-card p-5 h-fit">
        <h3 className="font-display text-lg font-medium text-ink mb-3">Status history</h3>
        <ul className="space-y-3">
          {q.data.history.map((h: any) => (
            <li key={h.id} className="text-sm">
              <div className="text-ink">
                {h.old_status ?? "—"} → <span className="font-medium">{h.new_status}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date(h.created_at).toLocaleString()} · {h.actor?.full_name ?? "system"}
              </div>
              {h.notes && <div className="text-xs text-muted-foreground mt-1">{h.notes}</div>}
            </li>
          ))}
          {q.data.history.length === 0 && (
            <li className="text-sm text-muted-foreground">No history yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
}

function Field({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
      {children}
    </div>
  );
}
