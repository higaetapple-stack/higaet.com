import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import {
  listInvoices, listPayments, updateInvoiceStatus, generateInvoicePdf,
  verifyPayment, financeKpis,
} from "@/lib/tech-finance.functions";
import { getTechDocSignedUrl } from "@/lib/tech-commercial.functions";

export const Route = createFileRoute("/_authenticated/dashboard/technologies/finance")({
  component: FinancePage,
});

const STATUS_BADGE: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-100 text-blue-700",
  partially_paid: "bg-amber-100 text-amber-700",
  paid: "bg-emerald-100 text-emerald-700",
  overdue: "bg-red-100 text-red-700",
  cancelled: "bg-muted text-muted-foreground line-through",
};

function FinancePage() {
  const [tab, setTab] = useState<"invoices" | "payments">("invoices");
  const kpiFn = useServerFn(financeKpis);
  const invFn = useServerFn(listInvoices);
  const payFn = useServerFn(listPayments);
  const statusFn = useServerFn(updateInvoiceStatus);
  const pdfFn = useServerFn(generateInvoicePdf);
  const verifyFn = useServerFn(verifyPayment);
  const signFn = useServerFn(getTechDocSignedUrl);
  const qc = useQueryClient();

  const kpis = useQuery({ queryKey: ["tech-finance-kpis"], queryFn: () => kpiFn() });
  const invoices = useQuery({ queryKey: ["tech-invoices"], queryFn: () => invFn() });
  const payments = useQuery({ queryKey: ["tech-payments"], queryFn: () => payFn() });

  const mStatus = useMutation({
    mutationFn: (v: { id: string; status: any }) => statusFn({ data: v }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tech-invoices"] }); toast.success("Updated"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const mPdf = useMutation({
    mutationFn: (id: string) => pdfFn({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tech-invoices"] }); toast.success("PDF generated"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const mVerify = useMutation({
    mutationFn: (v: { id: string; status: any }) => verifyFn({ data: v }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tech-payments"] }); toast.success("Updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const open = async (path: string | null) => {
    if (!path) return toast.error("No PDF yet");
    const { url } = await signFn({ data: { path } });
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Outstanding" value={`$${(kpis.data?.outstanding ?? 0).toLocaleString()}`} />
        <Kpi label="Paid (total)" value={`$${(kpis.data?.paid ?? 0).toLocaleString()}`} />
        <Kpi label="Overdue invoices" value={kpis.data?.overdue ?? 0} />
        <Kpi label="Pending verifications" value={kpis.data?.pendingVerifications ?? 0} />
      </div>

      <div className="flex gap-1 border-b border-border">
        {(["invoices", "payments"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm -mb-px border-b-2 ${tab === t ? "border-academy text-academy font-medium" : "border-transparent text-muted-foreground"}`}>
            {t === "invoices" ? "Invoices" : "Payments"}
          </button>
        ))}
        <div className="ml-auto pb-2">
          <Link to="/dashboard/technologies/finance" className="text-xs text-academy hover:underline">Refresh</Link>
        </div>
      </div>

      {tab === "invoices" && (
        <div className="ring-1 ring-border rounded-2xl bg-card divide-y divide-border">
          {(invoices.data ?? []).map((i: any) => (
            <div key={i.id} className="p-4 flex items-center gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="text-ink font-medium">{i.invoice_number} · {i.client?.company ?? "—"}</div>
                <div className="text-xs text-muted-foreground">
                  {i.currency} {Number(i.total).toLocaleString()} · paid {Number(i.amount_paid).toLocaleString()} · due {i.due_date ?? "—"}
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_BADGE[i.status] ?? "bg-muted"}`}>{i.status}</span>
              <div className="flex gap-1 flex-wrap">
                {i.status === "draft" && (
                  <button onClick={() => mStatus.mutate({ id: i.id, status: "sent" })} className="h-8 px-2 text-xs rounded ring-1 ring-border">Send</button>
                )}
                <button onClick={() => mPdf.mutate(i.id)} className="h-8 px-2 text-xs rounded ring-1 ring-border">Gen PDF</button>
                {i.pdf_url && (
                  <button onClick={() => open(i.pdf_url)} className="h-8 px-2 text-xs rounded ring-1 ring-border">Download</button>
                )}
                <Link to={"/dashboard/technologies/finance" as any} className="h-8 px-2 text-xs rounded ring-1 ring-border inline-flex items-center">Edit</Link>
              </div>
            </div>
          ))}
          {(invoices.data ?? []).length === 0 && (
            <div className="p-6 text-sm text-muted-foreground">No invoices yet. Use the API to create one.</div>
          )}
        </div>
      )}

      {tab === "payments" && (
        <div className="ring-1 ring-border rounded-2xl bg-card divide-y divide-border">
          {(payments.data ?? []).map((p: any) => (
            <div key={p.id} className="p-4 flex items-center gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="text-ink font-medium">{p.client?.company ?? "—"} · {p.currency} {Number(p.amount).toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">
                  {p.method} · ref {p.reference ?? "—"} · paid {p.paid_on}
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full bg-muted`}>{p.status}</span>
              {p.receipt_url && (
                <button onClick={() => open(p.receipt_url)} className="h-8 px-2 text-xs rounded ring-1 ring-border">Receipt</button>
              )}
              {p.status === "pending" && (
                <div className="flex gap-1">
                  <button onClick={() => mVerify.mutate({ id: p.id, status: "received" })} className="h-8 px-2 text-xs rounded bg-academy text-white">Verify</button>
                  <button onClick={() => mVerify.mutate({ id: p.id, status: "failed" })} className="h-8 px-2 text-xs rounded ring-1 ring-border text-red-600">Reject</button>
                </div>
              )}
            </div>
          ))}
          {(payments.data ?? []).length === 0 && (
            <div className="p-6 text-sm text-muted-foreground">No payments yet.</div>
          )}
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: any }) {
  return (
    <div className="ring-1 ring-border rounded-xl bg-card p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-medium text-ink mt-1">{value}</div>
    </div>
  );
}
