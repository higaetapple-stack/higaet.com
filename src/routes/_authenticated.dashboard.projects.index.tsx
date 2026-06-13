import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMyProjects } from "@/lib/academic.functions";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Rocket } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/projects/")({
  component: MyProjects,
});

function MyProjects() {
  const list = useServerFn(listMyProjects);
  const q = useQuery({ queryKey: ["my-projects"], queryFn: () => list() });
  const rows = q.data ?? [];

  return (
    <div className="max-w-5xl">
      <h1 className="font-display text-2xl font-medium text-ink">Capstone projects</h1>
      <p className="text-sm text-muted-foreground mt-1">
        Showcase your applied work — repos, demos, write-ups.
      </p>

      {q.isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="mt-8 rounded-2xl bg-card ring-1 ring-border p-10 text-center">
          <Rocket className="size-8 mx-auto text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">No projects assigned in your enrolled programs yet.</p>
        </div>
      ) : (
        <ul className="mt-6 grid sm:grid-cols-2 gap-4">
          {rows.map((p: any) => (
            <li key={p.id}>
              <Link
                to="/dashboard/projects/$id"
                params={{ id: p.id }}
                className="block rounded-2xl bg-card ring-1 ring-border p-5 hover:ring-academy/40 transition"
              >
                <div className="text-xs text-muted-foreground">{p.programs?.title}</div>
                <div className="font-display text-lg font-medium text-ink mt-1">{p.title}</div>
                {p.brief && <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{p.brief}</p>}
                <div className="mt-4 flex items-center justify-between gap-2">
                  <Badge className="capitalize">{p.submission?.status ?? "not started"}</Badge>
                  <span className="text-xs text-academy inline-flex items-center gap-1">
                    Open <ArrowRight className="size-3.5" />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
