import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMyCertificates } from "@/lib/academic.functions";
import { Award, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/dashboard/certificates/")({
  component: MyCertificates,
});

function MyCertificates() {
  const list = useServerFn(listMyCertificates);
  const q = useQuery({ queryKey: ["my-certificates"], queryFn: () => list() });
  const rows = q.data ?? [];

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-2xl font-medium text-ink">My certificates</h1>
      <p className="text-sm text-muted-foreground mt-1">
        Earned credentials are auto-issued when you complete a program.
      </p>

      {q.isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="mt-8 rounded-2xl bg-card ring-1 ring-border p-10 text-center">
          <Award className="size-8 mx-auto text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            No certificates yet — complete all lessons and required assignments in a program to earn one.
          </p>
        </div>
      ) : (
        <ul className="mt-6 grid sm:grid-cols-2 gap-4">
          {rows.map((c: any) => (
            <li key={c.id}>
              <Link
                to="/dashboard/certificates/$id"
                params={{ id: c.id }}
                className="block rounded-2xl bg-card ring-1 ring-border p-5 hover:ring-academy/40 transition"
              >
                <div className="flex items-center justify-between">
                  <Award className="size-8 text-academy" />
                  {c.revoked && <Badge variant="destructive">Revoked</Badge>}
                </div>
                <div className="mt-3 font-display text-lg font-medium text-ink">{c.programs?.title}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {c.certificate_number} · Issued {new Date(c.issued_at).toLocaleDateString()}
                </div>
                <div className="mt-3 text-xs text-academy inline-flex items-center gap-1">
                  View certificate <ArrowRight className="size-3.5" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
