import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, ShieldCheck, ShieldAlert, Copy } from "lucide-react";
import { toast } from "sonner";
import QRCode from "qrcode";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { recordMfaEvent, regenerateRecoveryCodes, getRecoveryCodeStatus } from "@/lib/security.functions";

interface Factor {
  id: string;
  friendly_name?: string | null;
  factor_type: string;
  status: "verified" | "unverified";
}

export function MfaCard() {
  const [factors, setFactors] = useState<Factor[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [pendingFactor, setPendingFactor] = useState<{ id: string; qr: string; secret: string } | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [recoveryStatus, setRecoveryStatus] = useState<{ total: number; unused: number } | null>(null);
  const [newCodes, setNewCodes] = useState<string[] | null>(null);

  const qc = useQueryClient();
  const recordEvent = useServerFn(recordMfaEvent);
  const regenCodes = useServerFn(regenerateRecoveryCodes);
  const codeStatus = useServerFn(getRecoveryCodeStatus);

  async function refresh() {
    setLoading(true);
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) toast.error(error.message);
    setFactors((data?.totp ?? []) as Factor[]);
    try {
      const s = await codeStatus();
      setRecoveryStatus({ total: s.total, unused: s.unused });
    } catch { /* ignore */ }
    setLoading(false);
  }
  useEffect(() => { refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const verified = factors.find((f) => f.status === "verified");

  async function startEnroll() {
    setEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: `HIGAET ${new Date().toISOString().slice(0, 10)}` });
      if (error) throw error;
      const qr = await QRCode.toDataURL(data.totp.uri);
      setPendingFactor({ id: data.id, qr, secret: data.totp.secret });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to start MFA enrollment");
    } finally {
      setEnrolling(false);
    }
  }

  async function verifyEnroll() {
    if (!pendingFactor) return;
    setVerifying(true);
    try {
      const { data: ch, error: cErr } = await supabase.auth.mfa.challenge({ factorId: pendingFactor.id });
      if (cErr) throw cErr;
      const { error: vErr } = await supabase.auth.mfa.verify({
        factorId: pendingFactor.id,
        challengeId: ch.id,
        code: verifyCode.trim(),
      });
      if (vErr) throw vErr;
      await recordEvent({ data: { kind: "enrolled", factor_id: pendingFactor.id } });
      const { codes } = await regenCodes();
      setNewCodes(codes);
      setPendingFactor(null);
      setVerifyCode("");
      toast.success("MFA enabled. Save your recovery codes.");
      qc.invalidateQueries({ queryKey: ["security-events"] });
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Verification failed");
    } finally {
      setVerifying(false);
    }
  }

  async function cancelEnroll() {
    if (!pendingFactor) return;
    await supabase.auth.mfa.unenroll({ factorId: pendingFactor.id });
    setPendingFactor(null);
    setVerifyCode("");
  }

  async function disableMfa() {
    if (!verified) return;
    if (!confirm("Disable two-factor authentication? Your account will be less secure.")) return;
    const { error } = await supabase.auth.mfa.unenroll({ factorId: verified.id });
    if (error) { toast.error(error.message); return; }
    await recordEvent({ data: { kind: "disabled", factor_id: verified.id } });
    toast.success("MFA disabled");
    qc.invalidateQueries({ queryKey: ["security-events"] });
    refresh();
  }

  async function regenerate() {
    if (!confirm("Generate new recovery codes? Existing codes will stop working.")) return;
    const { codes } = await regenCodes();
    setNewCodes(codes);
    refresh();
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="font-display font-semibold text-base text-ink flex items-center gap-2">
            {verified ? <ShieldCheck className="size-4 text-emerald-600" /> : <ShieldAlert className="size-4 text-amber-600" />}
            Two-factor authentication
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {verified ? "TOTP authenticator enabled." : "Add an authenticator app to protect your account."}
          </p>
        </div>
        {verified && (
          <button onClick={disableMfa} className="text-xs text-destructive hover:underline">
            Disable
          </button>
        )}
      </div>

      {loading ? (
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      ) : !verified && !pendingFactor ? (
        <button
          onClick={startEnroll}
          disabled={enrolling}
          className="inline-flex items-center gap-2 bg-ink text-surface text-sm font-medium px-3 py-2 rounded-md hover:bg-ink/90 disabled:opacity-60"
        >
          {enrolling && <Loader2 className="size-4 animate-spin" />}
          Set up authenticator
        </button>
      ) : pendingFactor ? (
        <div className="space-y-3">
          <p className="text-sm text-ink">Scan with Authy, 1Password, Google Authenticator, etc.</p>
          <img src={pendingFactor.qr} alt="MFA QR code" className="size-44 bg-white p-2 rounded-md ring-1 ring-border" />
          <p className="text-xs text-muted-foreground">
            Or enter secret manually: <code className="bg-muted px-1.5 py-0.5 rounded text-[11px]">{pendingFactor.secret}</code>
          </p>
          <div>
            <Label htmlFor="otp">6-digit code from app</Label>
            <Input id="otp" inputMode="numeric" maxLength={6} value={verifyCode} onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ""))} className="w-32 tracking-widest text-center font-mono" />
          </div>
          <div className="flex gap-2">
            <button onClick={verifyEnroll} disabled={verifying || verifyCode.length !== 6} className="inline-flex items-center gap-2 bg-ink text-surface text-sm font-medium px-3 py-2 rounded-md hover:bg-ink/90 disabled:opacity-60">
              {verifying && <Loader2 className="size-4 animate-spin" />}
              Verify &amp; enable
            </button>
            <button onClick={cancelEnroll} className="text-sm text-muted-foreground hover:text-ink px-3 py-2">Cancel</button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Recovery codes</span>
            <span className="text-ink">{recoveryStatus ? `${recoveryStatus.unused} / ${recoveryStatus.total} unused` : "—"}</span>
          </div>
          <button onClick={regenerate} className="text-xs text-academy hover:underline">
            Regenerate recovery codes
          </button>
        </div>
      )}

      {newCodes && (
        <div className="mt-4 p-3 rounded-md bg-amber-50 border border-amber-200">
          <div className="flex items-start justify-between mb-2">
            <p className="text-xs font-semibold text-amber-900">Save these recovery codes — they won't be shown again.</p>
            <button
              onClick={() => { navigator.clipboard.writeText(newCodes.join("\n")); toast.success("Copied"); }}
              className="text-amber-900 hover:text-amber-700"
              aria-label="Copy codes"
            >
              <Copy className="size-3.5" />
            </button>
          </div>
          <ul className="grid grid-cols-2 gap-1 font-mono text-xs text-amber-900">
            {newCodes.map((c) => <li key={c}>{c}</li>)}
          </ul>
          <button onClick={() => setNewCodes(null)} className="text-[11px] text-amber-900 underline mt-2">I've saved them</button>
        </div>
      )}
    </div>
  );
}
