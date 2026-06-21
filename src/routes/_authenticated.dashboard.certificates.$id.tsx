import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { getMyCertificate } from "@/lib/academic.functions";
import { getCertificateDownloadUrl } from "@/lib/certificates.functions";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/certificates/$id")({
  component: CertificateView,
});

function CertificateView() {
  const { id } = Route.useParams();
  const get = useServerFn(getMyCertificate);
  const getUrl = useServerFn(getCertificateDownloadUrl);
  const q = useQuery({ queryKey: ["certificate", id], queryFn: () => get({ data: { id } }) });

  const downloadMut = useMutation({
    mutationFn: async () => getUrl({ data: { id } }),
    onSuccess: (r) => {
      window.open(r.url, "_blank", "noopener");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (q.isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (q.error || !q.data) return <p className="text-sm text-muted-foreground">Not found.</p>;
  const c: any = q.data;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between gap-3 mb-4 print:hidden">
        <Link to="/dashboard/certificates" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-ink">
          <ArrowLeft className="size-3.5" /> All certificates
        </Link>
        <div className="flex items-center gap-2">
          {c.verification_token && (
            <Button asChild size="sm" variant="outline">
              <a href={`/verify/${c.verification_token}`} target="_blank" rel="noopener">
                <ShieldCheck className="size-4" /> Verify
              </a>
            </Button>
          )}
          <Button size="sm" onClick={() => downloadMut.mutate()} disabled={downloadMut.isPending}
            className="bg-academy text-academy-foreground hover:bg-academy/90">
            <Download className="size-4" /> {downloadMut.isPending ? "Preparing…" : "Download PDF"}
          </Button>
        </div>
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
