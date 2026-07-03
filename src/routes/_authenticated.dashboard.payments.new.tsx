import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Download, Maximize2 } from "lucide-react";
import {
  listMyManualPayments,
  submitManualPayment,
} from "@/lib/manual-payments.functions";
import { listMyRefunds, requestRefund } from "@/lib/refunds.functions";
import { supabase } from "@/integrations/supabase/client";
import { paymentEvents } from "@/lib/analytics-events";
import {
  PAYMENT_INSTRUCTIONS,
  PAYMENT_METHODS,
  PAYMENT_PURPOSES,
} from "@/content/payment-instructions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { cn } from "@/lib/utils";
import { CopyButton } from "@/components/payments/CopyButton";
import { PaymentStatusTimeline } from "@/components/payments/PaymentStatusTimeline";

const SearchSchema = z.object({
  purpose: z.string().optional(),
  amount: z.coerce.number().optional(),
  ref_table: z.string().optional(),
  ref_id: z.string().optional(),
  currency: z.string().optional(),
});

export const Route = createFileRoute("/_authenticated/dashboard/payments/new")({
  validateSearch: (s) => SearchSchema.parse(s),
  component: NewPaymentPage,
});

function NewPaymentPage() {
  const search = Route.useSearch();
  const submit = useServerFn(submitManualPayment);
  const listMine = useServerFn(listMyManualPayments);
  const listRefundsFn = useServerFn(listMyRefunds);
  const requestRefundFn = useServerFn(requestRefund);
  const qc = useQueryClient();
  const router = useRouter();

  const myQ = useQuery({ queryKey: ["my-manual-payments"], queryFn: () => listMine() });
  const refundQ = useQuery({ queryKey: ["my-refunds"], queryFn: () => listRefundsFn() });
  const refundMap = useMemo(() => {
    const m = new Map<string, { status: string; reason: string | null }>();
    for (const r of refundQ.data ?? []) m.set(r.payment_id, { status: r.status, reason: r.reason });
    return m;
  }, [refundQ.data]);

  const [method, setMethod] = useState<string>("upi");
  const [purpose, setPurpose] = useState<string>(search.purpose ?? "course_enrollment");
  const [amount, setAmount] = useState<string>(search.amount ? String(search.amount) : "");
  const [currency, setCurrency] = useState<string>(search.currency ?? "INR");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const submitMut = useMutation({
    mutationFn: async () => {
      const amt = Math.round(Number(amount) * 100);
      if (!Number.isFinite(amt) || amt <= 0) throw new Error("Enter a valid amount");
      if (reference.trim().length < 2) throw new Error("Enter your UTR / transaction reference");

      paymentEvents.checkoutStarted({
        purpose,
        method,
        amount_minor: amt,
        currency,
      });

      let proof_url: string | undefined;
      if (file) {
        setUploading(true);
        const { data: u } = await supabase.auth.getUser();
        const uid = u.user?.id;
        if (!uid) throw new Error("Not signed in");
        const path = `${uid}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const up = await supabase.storage.from("payment-proofs").upload(path, file);
        setUploading(false);
        if (up.error) throw new Error(up.error.message);
        proof_url = path;
      }

      return submit({
        data: {
          amount_minor: amt,
          currency,
          purpose: purpose as never,
          method: method as never,
          reference: reference.trim(),
          proof_url,
          ref_table: search.ref_table,
          ref_id: search.ref_id,
          payer_notes: notes.trim() || undefined,
        },
      });
    },
    onSuccess: (result: any) => {
      const amt = Math.round(Number(amount) * 100);
      paymentEvents.paymentSucceeded({
        payment_id: result?.id,
        purpose,
        amount_minor: amt,
        currency,
      });
      toast.success("Payment submitted — awaiting verification");
      qc.invalidateQueries({ queryKey: ["my-manual-payments"] });
      setReference("");
      setNotes("");
      setFile(null);
      router.navigate({ to: "/dashboard/payments/new", search: {} });
    },
    onError: (e: Error) => {
      paymentEvents.paymentFailed({ purpose, method, reason: e.message });
      toast.error(e.message);
    },
  });

  const isUpiLike = ["upi", "google_pay", "phonepe", "paytm", "amazon_pay"].includes(method);
  const isBank = method === "bank_transfer";
  const isPaypal = method === "paypal";
  const isWire = method === "bank_wire";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Submit payment</h1>
        <p className="text-sm text-muted-foreground">
          Pay via UPI, bank transfer or PayPal and upload your receipt. An admin will verify and activate your service.
        </p>
      </header>

      {/* Method picker as visual cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3" role="radiogroup" aria-label="Payment method">
        {PAYMENT_METHODS.map((m) => (
          <button
            type="button"
            key={m.value}
            role="radio"
            aria-checked={method === m.value}
            onClick={() => setMethod(m.value)}
            className={cn(
              "rounded-lg border p-3 text-left transition hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              method === m.value ? "border-primary bg-primary/5" : "border-border",
            )}
          >
            <div className="text-lg" aria-hidden>{m.icon}</div>
            <div className="text-sm font-medium mt-1">{m.label}</div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{m.region}</div>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>1. Pay using {PAYMENT_METHODS.find((m) => m.value === method)?.label}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(isUpiLike || isBank) && (
              <>
                {isUpiLike && (
                  <div className="rounded-md border border-border p-4 space-y-3 text-sm">
                    <div className="font-medium">UPI</div>
                    <ul className="space-y-1">
                      {PAYMENT_INSTRUCTIONS.upi.ids.map((id) => (
                        <li key={id} className="flex items-center justify-between gap-2">
                          <span className="font-mono">{id}</span>
                          <CopyButton value={id} label={`UPI ID ${id}`} />
                        </li>
                      ))}
                    </ul>
                    <div className="text-xs text-muted-foreground">Name: {PAYMENT_INSTRUCTIONS.upi.name}</div>

                    <QrSection />
                  </div>
                )}
                {isBank && (
                  <div className="rounded-md border border-border p-4 space-y-2 text-sm">
                    <div className="font-medium">Bank transfer (NEFT / IMPS / RTGS)</div>
                    <DetailRow label="Account name" value={PAYMENT_INSTRUCTIONS.bank.accountName} mono={false} />
                    <DetailRow label="Account number" value={PAYMENT_INSTRUCTIONS.bank.accountNumber} />
                    <DetailRow label="IFSC" value={PAYMENT_INSTRUCTIONS.bank.ifsc} />
                    <DetailRow label="Bank" value={`${PAYMENT_INSTRUCTIONS.bank.bankName}, ${PAYMENT_INSTRUCTIONS.bank.branch}`} mono={false} />
                  </div>
                )}
              </>
            )}

            {isPaypal && (
              <div className="rounded-md border border-border p-4 space-y-2 text-sm">
                <div className="font-medium">PayPal</div>
                <DetailRow label="Send to" value={PAYMENT_INSTRUCTIONS.paypal.email} />
                <div className="text-muted-foreground text-xs">Please send as &quot;Goods &amp; Services&quot; and include your name in the note.</div>
              </div>
            )}

            {isWire && (
              <div className="rounded-md border border-border p-4 space-y-2 text-sm">
                <div className="font-medium">International bank wire</div>
                <DetailRow label="Beneficiary" value={PAYMENT_INSTRUCTIONS.bankWire.accountName} mono={false} />
                <DetailRow label="Account number" value={PAYMENT_INSTRUCTIONS.bankWire.accountNumber} />
                <DetailRow label="SWIFT" value={PAYMENT_INSTRUCTIONS.bankWire.swift} />
                <DetailRow label="Bank" value={PAYMENT_INSTRUCTIONS.bankWire.bankName} mono={false} />
                <div className="text-xs text-muted-foreground">{PAYMENT_INSTRUCTIONS.bankWire.address}</div>
              </div>
            )}

            <div className="rounded-md bg-muted/40 border border-border p-4 text-sm">
              <div className="font-medium mb-2">How it works</div>
              <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
                <li>Make the payment using the details above</li>
                <li>Save the success screenshot from your app</li>
                <li>Enter the UTR / transaction ID on the right</li>
                <li>Upload the screenshot as proof</li>
                <li>Submit for verification</li>
                <li>You&apos;ll be notified once an admin verifies it (usually within a few hours)</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Submit proof for verification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Purpose</Label>
              <Select value={purpose} onValueChange={setPurpose}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_PURPOSES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>UTR / Transaction reference</Label>
              <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. 412345678901" maxLength={100} />
            </div>

            <div className="space-y-2">
              <Label>Screenshot (recommended)</Label>
              <Input type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </div>

            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} rows={3} />
            </div>

            <Button onClick={() => submitMut.mutate()} disabled={submitMut.isPending || uploading} className="w-full">
              {submitMut.isPending || uploading ? "Submitting…" : "Submit for verification"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>My recent payments</CardTitle></CardHeader>
        <CardContent>
          {myQ.isLoading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : (myQ.data ?? []).length === 0 ? (
            <div className="text-sm text-muted-foreground">No payments submitted yet.</div>
          ) : (
            <ul className="divide-y divide-border">
              {myQ.data!.map((p) => {
                const refund = refundMap.get(p.id);
                const canRefund = !refund && ["approved", "captured", "partially_refunded"].includes(p.status);
                return (
                  <li key={p.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium">
                        {(p.amount_minor / 100).toLocaleString(undefined, { style: "currency", currency: p.currency })}
                        <span className="text-muted-foreground font-normal"> · {p.purpose.replace(/_/g, " ")}</span>
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">{p.method} · {p.reference}</div>
                      {p.rejection_reason && (
                        <div className="text-xs text-destructive mt-1">{p.rejection_reason}</div>
                      )}
                      {refund && (
                        <div className="text-xs mt-1">
                          <span className="text-muted-foreground">Refund: </span>
                          <span
                            className={cn(
                              refund.status === "processed" && "text-success",
                              refund.status === "failed" && "text-destructive",
                              refund.status === "pending" && "text-warning",
                            )}
                          >
                            {refund.status}
                          </span>
                          {refund.reason && <span className="text-muted-foreground"> — {refund.reason}</span>}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <PaymentStatusTimeline status={p.status} />
                      {canRefund && (
                        <RequestRefundDialog
                          payment={{ id: p.id, amount_minor: p.amount_minor, currency: p.currency }}
                          onSubmit={async (reason) => {
                            await requestRefundFn({ data: { payment_id: p.id, reason } });
                            paymentEvents.refundRequested({ payment_id: p.id, reason });
                            toast.success("Refund request submitted");
                            qc.invalidateQueries({ queryKey: ["my-refunds"] });
                          }}
                        />
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DetailRow({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={cn("text-sm", mono && "font-mono")}>{value}</div>
      </div>
      <CopyButton value={value} label={label} />
    </div>
  );
}

function QrSection() {
  return (
    <div className="pt-2">
      <Dialog>
        <div className="flex flex-col items-start gap-2">
          <DialogTrigger asChild>
            <button
              type="button"
              className="group relative"
              aria-label="Open QR full screen"
            >
              <img
                src={PAYMENT_INSTRUCTIONS.upi.qrImage}
                alt="HIGAET UPI QR code — scan to pay"
                className="size-44 border border-border rounded-md bg-white p-2"
                onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
              />
              <span className="absolute inset-0 hidden group-hover:flex items-center justify-center bg-black/40 text-white rounded-md">
                <Maximize2 className="size-5" />
              </span>
            </button>
          </DialogTrigger>
          <div className="flex gap-2">
            <Button asChild size="sm" variant="outline">
              <a href={PAYMENT_INSTRUCTIONS.upi.qrImage} download="higaet-payment-qr.png">
                <Download className="size-3.5 mr-1" /> Download QR
              </a>
            </Button>
          </div>
        </div>
        <DialogContent className="max-w-md">
          <img
            src={PAYMENT_INSTRUCTIONS.upi.qrImage}
            alt="HIGAET UPI QR code — full size"
            className="w-full h-auto rounded-md bg-white p-4"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
