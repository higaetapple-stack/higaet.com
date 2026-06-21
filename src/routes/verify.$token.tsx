import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { verifyCertificateByToken } from "@/lib/certificates.functions";
import { ShieldCheck, ShieldX, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/verify/$token")({
  head: () => ({
    meta: [
      { title: "Verify Certificate — HIGAET" },
      { name: "description", content: "Verify the authenticity of a HIGAET Academy certificate." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: VerifyTokenPage,
});

function VerifyTokenPage() {
  const { token } = Route.useParams();
  const fn = useServerFn(verifyCertificateByToken);
  const q = useQuery({
    queryKey: ["verify-cert-token", token],
    queryFn: () => fn({ data: { token } }),
  });

  return (
    <div className="min-h-screen bg-background grid place-items-center px-6 py-16">
      <div className="w-full max-w-xl rounded-2xl bg-card ring-1 ring-border p-8">
        <div className="text-xs uppercase tracking-[0.3em] text-academy font-medium text-center">
          HIGAET Academy · Certificate Verification
        </div>

        {q.isLoading && (
          <p className="mt-8 text-center text-sm text-muted-foreground">Checking certificate…</p>
        )}

        {!q.isLoading && q.data && !q.data.valid && (
          <div className="mt-8 text-center">
            <ShieldX className="size-12 mx-auto text-destructive" />
            <h1 className="font-display text-2xl text-ink mt-4">Invalid certificate</h1>
            <p className="text-sm text-muted-foreground mt-2">
              We could not match a HIGAET certificate to this verification link.
            </p>
          </div>
        )}

        {!q.isLoading && q.data && q.data.valid && (
          <div className="mt-8">
            <div className="text-center">
              {q.data.revoked ? (
                <>
                  <ShieldAlert className="size-12 mx-auto text-amber-600" />
                  <h1 className="font-display text-2xl text-ink mt-4">Certificate revoked</h1>
                  <p className="text-sm text-muted-foreground mt-2">
                    This credential has been revoked by HIGAET Academy.
                  </p>
                </>
              ) : (
                <>
                  <ShieldCheck className="size-12 mx-auto text-academy" />
                  <h1 className="font-display text-2xl text-ink mt-4">Verified</h1>
                  <p className="text-sm text-muted-foreground mt-2">
                    This is an authentic HIGAET Academy credential.
                  </p>
                </>
              )}
            </div>
            <dl className="mt-6 divide-y divide-border text-sm">
              <Row label="Student" value={q.data.student_name} />
              <Row label="Program" value={q.data.program_title} />
              <Row label="Issued" value={new Date(q.data.issued_at as any).toLocaleDateString()} />
              <Row label="Certificate No." value={q.data.certificate_number} />
              <Row
                label="Verification hash"
                value={<span className="font-mono text-xs break-all">{q.data.verification_hash}</span>}
              />
            </dl>
          </div>
        )}

        <p className="mt-8 text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:text-ink">Back to HIGAET</Link>
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="py-3 flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-ink text-right max-w-[60%]">{value}</dd>
    </div>
  );
}
