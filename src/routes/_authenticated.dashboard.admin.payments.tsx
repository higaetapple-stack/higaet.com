import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Search } from "lucide-react";
import {
  adminApprovePayment,
  adminListManualPayments,
  adminRejectPayment,
  adminRequestPaymentInfo,
  getProofSignedUrl,
} from "@/lib/manual-payments.functions";
import { adminListRefunds, adminUpdateRefundStatus } from "@/lib/refunds.functions";
import { paymentEvents } from "@/lib/analytics-events";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard/admin/payments")({
  component: AdminPaymentsPage,
});

const STATUS_COLOR: Record<string, string> = {
  pending_verification: "bg-warning/15 text-warning",
  approved: "bg-success/15 text-success",
  rejected: "bg-destructive/15 text-destructive",
  info_requested: "bg-warning/15 text-warning",
};

const FILTERS = [
  { value: "pending_verification", label: "Pending" },
  { value: "info_requested", label: "Info requested" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
] as const;

type Filter = (typeof FILTERS)[number]["value"];

function AdminPaymentsPage() {
  const list = useServerFn(adminListManualPayments);
  const approve = useServerFn(adminApprovePayment);
  const reject = useServerFn(adminRejectPayment);
  const requestInfo = useServerFn(adminRequestPaymentInfo);
  const signProof = useServerFn(getProofSignedUrl);
  const qc = useQueryClient();

  const [status, setStatus] = useState<Filter>("pending_verification");
  const [search, setSearch] = useState("");

  const q = useQuery({
    queryKey: ["admin-manual-payments", status],
    queryFn: () => list({ data: { status } }),
  });

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return q.data ?? [];
    return (q.data ?? []).filter((p) =>
      [p.id, p.reference, p.user_id, p.ref_id ?? ""].some((v) => v?.toLowerCase().includes(s)),
    );
  }, [q.data, search]);

  const approveMut = useMutation({
    mutationFn: async (id: string) => approve({ data: { id } }),
    onSuccess: (r) => {
      toast.success(r.activation_warning ? `Approved (warning: ${r.activation_warning})` : "Approved");
      qc.invalidateQueries({ queryKey: ["admin-manual-payments"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Payment verification</h1>
        <p className="text-sm text-muted-foreground">Review manual UPI / bank / PayPal submissions.</p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1 p-1 rounded-md border border-border">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setStatus(f.value)}
              className={cn(
                "px-3 py-1.5 rounded text-sm",
                status === f.value ? "bg-primary text-primary-foreground" : "hover:bg-muted",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by UTR, payment id, user…"
            className="pl-8"
          />
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>{filtered.length} payment(s)</CardTitle></CardHeader>
        <CardContent>
          {q.isLoading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-muted-foreground">No payments match.</div>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((p) => (
                <li key={p.id} className="py-4 grid md:grid-cols-[1fr_auto] gap-4">
                  <div className="flex gap-3">
                    {p.proof_url && (
                      <ProofThumb path={p.proof_url} sign={(path) => signProof({ data: { path } })} />
                    )}
                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold">
                          {(p.amount_minor / 100).toLocaleString(undefined, { style: "currency", currency: p.currency })}
                        </span>
                        <Badge className={STATUS_COLOR[p.status] ?? ""}>{p.status.replace(/_/g, " ")}</Badge>
                        <span className="text-xs text-muted-foreground">{p.purpose.replace(/_/g, " ")}</span>
                      </div>
                      <div className="text-xs text-muted-foreground font-mono break-all">
                        {p.method} · ref {p.reference} · user {p.user_id.slice(0, 8)}…
                        {p.ref_id ? ` · ${p.ref_table ?? "ref"} ${p.ref_id.slice(0, 8)}…` : ""}
                      </div>
                      {p.payer_notes && <div className="text-xs text-muted-foreground">&ldquo;{p.payer_notes}&rdquo;</div>}
                      {p.rejection_reason && <div className="text-xs text-destructive">{p.rejection_reason}</div>}
                      <div className="text-[11px] text-muted-foreground">
                        Submitted {new Date(p.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 md:justify-end">
                    {(p.status === "pending_verification" || p.status === "info_requested") && (
                      <>
                        <Button size="sm" onClick={() => approveMut.mutate(p.id)} disabled={approveMut.isPending}>
                          Approve
                        </Button>
                        <ReasonDialog
                          label="Request info"
                          variant="outline"
                          confirmLabel="Send"
                          onSubmit={async (reason) => {
                            await requestInfo({ data: { id: p.id, reason } });
                            toast.success("Info requested");
                            qc.invalidateQueries({ queryKey: ["admin-manual-payments"] });
                          }}
                        />
                        <ReasonDialog
                          label="Reject"
                          variant="destructive"
                          confirmLabel="Reject"
                          onSubmit={async (reason) => {
                            await reject({ data: { id: p.id, reason } });
                            toast.success("Rejected");
                            qc.invalidateQueries({ queryKey: ["admin-manual-payments"] });
                          }}
                        />
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ProofThumb({
  path,
  sign,
}: {
  path: string;
  sign: (path: string) => Promise<{ url: string }>;
}) {
  const q = useQuery({
    queryKey: ["proof-url", path],
    queryFn: () => sign(path),
    staleTime: 4 * 60 * 1000,
  });
  const url = q.data?.url;
  const isPdf = path.toLowerCase().endsWith(".pdf");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="shrink-0 size-20 rounded-md border border-border bg-muted overflow-hidden grid place-items-center text-xs text-muted-foreground"
          aria-label="View proof"
        >
          {url && !isPdf ? (
            <img src={url} alt="Payment proof" className="w-full h-full object-cover" />
          ) : (
            <span>{isPdf ? "PDF" : q.isLoading ? "…" : "Open"}</span>
          )}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle>Payment proof</DialogTitle></DialogHeader>
        {url ? (
          isPdf ? (
            <iframe src={url} title="Payment proof PDF" className="w-full h-[70vh] rounded border border-border" />
          ) : (
            <img src={url} alt="Payment proof full size" className="max-h-[70vh] w-auto mx-auto rounded" />
          )
        ) : (
          <div className="text-sm text-muted-foreground">Loading…</div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ReasonDialog({
  label,
  confirmLabel,
  variant,
  onSubmit,
}: {
  label: string;
  confirmLabel: string;
  variant: "outline" | "destructive";
  onSubmit: (reason: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant={variant}>{label}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{label}</DialogTitle></DialogHeader>
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} placeholder="Reason / message to the payer" />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
          <Button
            variant={variant}
            disabled={busy || reason.trim().length < 2}
            onClick={async () => {
              setBusy(true);
              try {
                await onSubmit(reason.trim());
                setOpen(false);
                setReason("");
              } catch (e) {
                toast.error((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
