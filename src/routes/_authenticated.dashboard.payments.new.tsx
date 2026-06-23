import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import {
  listMyManualPayments,
  submitManualPayment,
} from "@/lib/manual-payments.functions";
import { supabase } from "@/integrations/supabase/client";
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

const STATUS_COLOR: Record<string, string> = {
  pending_verification: "bg-warning/15 text-warning",
  approved: "bg-success/15 text-success",
  rejected: "bg-destructive/15 text-destructive",
  info_requested: "bg-warning/15 text-warning",
};

function NewPaymentPage() {
  const search = Route.useSearch();
  const submit = useServerFn(submitManualPayment);
  const listMine = useServerFn(listMyManualPayments);
  const qc = useQueryClient();
  const router = useRouter();

  const myQ = useQuery({ queryKey: ["my-manual-payments"], queryFn: () => listMine() });

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
    onSuccess: () => {
      toast.success("Payment submitted — awaiting verification");
      qc.invalidateQueries({ queryKey: ["my-manual-payments"] });
      setReference("");
      setNotes("");
      setFile(null);
      router.navigate({ to: "/dashboard/payments/new", search: {} });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const isIndia = ["upi", "google_pay", "phonepe", "paytm", "amazon_pay", "bank_transfer"].includes(method);
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

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>1. Pay using your preferred method</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isIndia && (
              <div className="rounded-md border border-border p-4 space-y-2 text-sm">
                <div className="font-medium">UPI</div>
                <div>UPI ID: <span className="font-mono">{PAYMENT_INSTRUCTIONS.upi.id}</span></div>
                <div>Name: {PAYMENT_INSTRUCTIONS.upi.name}</div>
                <img
                  src={PAYMENT_INSTRUCTIONS.upi.qrImage}
                  alt="UPI QR code"
                  className="size-40 border border-border rounded-md mt-2"
                  onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                />
                <div className="pt-3 mt-3 border-t border-border">
                  <div className="font-medium mb-1">Bank transfer (NEFT / IMPS / RTGS)</div>
                  <div>Account: {PAYMENT_INSTRUCTIONS.bank.accountName}</div>
                  <div>A/C No: <span className="font-mono">{PAYMENT_INSTRUCTIONS.bank.accountNumber}</span></div>
                  <div>IFSC: <span className="font-mono">{PAYMENT_INSTRUCTIONS.bank.ifsc}</span></div>
                  <div>Bank: {PAYMENT_INSTRUCTIONS.bank.bankName}, {PAYMENT_INSTRUCTIONS.bank.branch}</div>
                </div>
              </div>
            )}

            {isPaypal && (
              <div className="rounded-md border border-border p-4 space-y-1 text-sm">
                <div className="font-medium">PayPal</div>
                <div>Send to: <span className="font-mono">{PAYMENT_INSTRUCTIONS.paypal.email}</span></div>
                <div className="text-muted-foreground text-xs">Please send as &quot;Goods &amp; Services&quot; and include your name in the note.</div>
              </div>
            )}

            {isWire && (
              <div className="rounded-md border border-border p-4 space-y-1 text-sm">
                <div className="font-medium">International bank wire</div>
                <div>Beneficiary: {PAYMENT_INSTRUCTIONS.bankWire.accountName}</div>
                <div>A/C No: <span className="font-mono">{PAYMENT_INSTRUCTIONS.bankWire.accountNumber}</span></div>
                <div>SWIFT: <span className="font-mono">{PAYMENT_INSTRUCTIONS.bankWire.swift}</span></div>
                <div>Bank: {PAYMENT_INSTRUCTIONS.bankWire.bankName}</div>
                <div>{PAYMENT_INSTRUCTIONS.bankWire.address}</div>
              </div>
            )}
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
              <Label>Screenshot (optional)</Label>
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
              {myQ.data!.map((p) => (
                <li key={p.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-medium">
                      {(p.amount_minor / 100).toLocaleString(undefined, { style: "currency", currency: p.currency })}
                      <span className="text-muted-foreground font-normal"> · {p.purpose.replace(/_/g, " ")}</span>
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">{p.method} · {p.reference}</div>
                    {p.rejection_reason && (
                      <div className="text-xs text-destructive mt-1">{p.rejection_reason}</div>
                    )}
                  </div>
                  <Badge className={STATUS_COLOR[p.status] ?? ""}>{p.status.replace(/_/g, " ")}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
