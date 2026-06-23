import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import {
  adminApprovePayment,
  adminListManualPayments,
  adminRejectPayment,
  adminRequestPaymentInfo,
  getProofSignedUrl,
} from "@/lib/manual-payments.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/dashboard/admin/payments")({
  component: AdminPaymentsPage,
});

const STATUS_COLOR: Record<string, string> = {
  pending_verification: "bg-warning/15 text-warning",
  approved: "bg-success/15 text-success",
  rejected: "bg-destructive/15 text-destructive",
  info_requested: "bg-warning/15 text-warning",
};

function AdminPaymentsPage() {
  const list = useServerFn(adminListManualPayments);
  const approve = useServerFn(adminApprovePayment);
  const reject = useServerFn(adminRejectPayment);
  const requestInfo = useServerFn(adminRequestPaymentInfo);
  const signProof = useServerFn(getProofSignedUrl);
  const qc = useQueryClient();

  const [status, setStatus] = useState<"pending_verification" | "approved" | "rejected" | "info_requested" | "all">(
    "pending_verification",
  );

  const q = useQuery({
    queryKey: ["admin-manual-payments", status],
    queryFn: () => list({ data: { status } }),
  });

  const approveMut = useMutation({
    mutationFn: async (id: string) => approve({ data: { id } }),
    onSuccess: (r) => {
      toast.success(r.activation_warning ? `Approved (warning: ${r.activation_warning})` : "Approved");
      qc.invalidateQueries({ queryKey: ["admin-manual-payments"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openProof = async (path: string) => {
    try {
      const r = await signProof({ data: { path } });
      window.open(r.url, "_blank", "noopener");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Payment verification</h1>
          <p className="text-sm text-muted-foreground">Review manual UPI / bank / PayPal submissions.</p>
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as never)}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pending_verification">Pending</SelectItem>
            <SelectItem value="info_requested">Info requested</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
      </header>

      <Card>
        <CardHeader><CardTitle>{q.data?.length ?? 0} payment(s)</CardTitle></CardHeader>
        <CardContent>
          {q.isLoading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : (q.data ?? []).length === 0 ? (
            <div className="text-sm text-muted-foreground">No payments in this view.</div>
          ) : (
            <ul className="divide-y divide-border">
              {q.data!.map((p) => (
                <li key={p.id} className="py-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">
                        {(p.amount_minor / 100).toLocaleString(undefined, { style: "currency", currency: p.currency })}
                      </span>
                      <Badge className={STATUS_COLOR[p.status] ?? ""}>{p.status.replace(/_/g, " ")}</Badge>
                      <span className="text-xs text-muted-foreground">{p.purpose.replace(/_/g, " ")}</span>
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {p.method} · ref {p.reference} · user {p.user_id.slice(0, 8)}…
                      {p.ref_id ? ` · ${p.ref_table ?? "ref"} ${p.ref_id.slice(0, 8)}…` : ""}
                    </div>
                    {p.payer_notes && <div className="text-xs text-muted-foreground">&ldquo;{p.payer_notes}&rdquo;</div>}
                    {p.rejection_reason && <div className="text-xs text-destructive">{p.rejection_reason}</div>}
                    <div className="text-[11px] text-muted-foreground">
                      Submitted {new Date(p.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {p.proof_url && (
                      <Button size="sm" variant="outline" onClick={() => openProof(p.proof_url!)}>
                        View proof
                      </Button>
                    )}
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
