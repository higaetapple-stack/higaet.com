import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyCertificate } from "@/lib/academic.functions";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/certificates/$id")({
  component: CertificateView,
});

function CertificateView() {
  const { id } = Route.useParams();
  const get = useServerFn(getMyCertificate);
  const q = useQuery({ queryKey: ["certificate", id], queryFn: () => get({ data: { id } }) });

  if (q.isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (q.error || !q.data) return <p className="text-sm text-muted-foreground">Not found.</p>;
  const c: any = q.data;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between gap-3 mb-4 print:hidden">
        <Link to="/dashboard/certificates" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-ink">
          <ArrowLeft className="size-3.5" /> All certificates
        </Link>
        <Button size="sm" variant="outline" onClick={() => window.print()}>
          <Printer className="size-4" /> Print / Save PDF
        </Button>
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-academy/5 to-transparent ring-1 ring-academy/30 p-12 print:ring-0 print:bg-white">
        <div className="text-center">
          <div className="text-xs uppercase tracking-[0.3em] text-academy font-medium">HIGAET Academy</div>
          <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
            Helen Institute of Gen AI Engineering & Technology
          </div>

          <h1 className="font-display text-3xl font-medium text-ink mt-10">Certificate of Completion</h1>
          <p className="text-muted-foreground text-sm mt-2">This is to certify that</p>

          <div className="font-display text-4xl font-medium text-ink mt-6">
            {c.profiles?.full_name ?? "Student"}
          </div>

          <p className="text-muted-foreground text-sm mt-6">
            has successfully completed the program
          </p>
          <div className="font-display text-2xl text-academy mt-2">{c.programs?.title}</div>

          <div className="mt-12 grid grid-cols-3 gap-6 text-xs text-muted-foreground">
            <div>
              <div className="text-ink font-medium">{new Date(c.issued_at).toLocaleDateString()}</div>
              <div className="mt-1 uppercase tracking-wider">Issued</div>
            </div>
            <div>
              <div className="text-ink font-medium">{c.certificate_number}</div>
              <div className="mt-1 uppercase tracking-wider">Certificate No.</div>
            </div>
            <div>
              <div className="text-ink font-medium font-mono text-[10px] break-all">
                {(c.verification_hash ?? "").slice(0, 16)}…
              </div>
              <div className="mt-1 uppercase tracking-wider">Verification Hash</div>
            </div>
          </div>

          <p className="mt-8 text-xs text-muted-foreground inline-flex items-center gap-1.5">
            <ShieldCheck className="size-3.5" /> Verify at /verify-certificate/{c.certificate_number}
          </p>
        </div>
      </div>
    </div>
  );
}
