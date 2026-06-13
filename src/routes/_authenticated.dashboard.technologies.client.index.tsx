import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { myClientWorkspace } from "@/lib/technologies.functions";
import { myProposalsAndContracts, getTechDocSignedUrl, updateProposalStatus } from "@/lib/tech-commercial.functions";

export const Route = createFileRoute("/_authenticated/dashboard/technologies/client/")({
  component: ClientPortal,
});

function ClientPortal() {
  const fn = useServerFn(myClientWorkspace);
  const commFn = useServerFn(myProposalsAndContracts);
  const signFn = useServerFn(getTechDocSignedUrl);
  const respondFn = useServerFn(updateProposalStatus);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["my-client-workspace"], queryFn: () => fn() });
  const comm = useQuery({ queryKey: ["my-proposals-contracts"], queryFn: () => commFn() });

  const mRespond = useMutation({
    mutationFn: (v: { id: string; status: string }) => respondFn({ data: v as any }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-proposals-contracts"] }); toast.success("Response recorded"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const openSigned = async (path: string | null) => {
    if (!path) return toast.error("No PDF yet");
    const { url } = await signFn({ data: { path } });
    window.open(url, "_blank");
  };

  if (q.isLoading) return <div className="text-muted-foreground">Loading…</div>;
  if (!q.data?.client) {
    return (
      <div className="ring-1 ring-border rounded-2xl bg-card p-6 text-sm text-muted-foreground">
        Your client portal isn't linked yet. Your account manager will connect your company shortly.
      </div>
    );
  }
  const { client, projects } = q.data;
  const proposals = comm.data?.proposals ?? [];
  const contracts = comm.data?.contracts ?? [];

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Client portal</div>
        <h2 className="font-display text-2xl font-medium text-ink mt-1">{client.company}</h2>
      </div>

      <div className="ring-1 ring-border rounded-2xl bg-card p-5">
        <h3 className="font-display text-lg font-medium text-ink mb-3">Your projects</h3>
        <ul className="space-y-2">
          {projects.map((p: any) => (
            <li key={p.id} className="ring-1 ring-border rounded-xl bg-background p-3 flex items-center gap-3">
              <div className="flex-1">
                <div className="text-ink font-medium">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.status} · {p.start_date ?? "—"} → {p.end_date ?? "—"}</div>
              </div>
              <Link to="/dashboard/technologies/client/$id" params={{ id: p.id }} className="text-academy text-xs hover:underline">Open →</Link>
            </li>
          ))}
          {projects.length === 0 && <li className="text-sm text-muted-foreground">No projects yet.</li>}
        </ul>
      </div>

      <div className="ring-1 ring-border rounded-2xl bg-card p-5">
        <h3 className="font-display text-lg font-medium text-ink mb-3">Proposals</h3>
        <ul className="space-y-2">
          {proposals.map((p: any) => (
            <li key={p.id} className="ring-1 ring-border rounded-xl bg-background p-3">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="text-ink font-medium truncate">{p.title}</div>
                  <div className="text-xs text-muted-foreground">
                    v{p.current_version} · {p.status}
                    {p.total_amount ? ` · ${p.currency} ${Number(p.total_amount).toLocaleString()}` : ""}
                    {p.valid_until ? ` · valid until ${p.valid_until}` : ""}
                  </div>
                </div>
                {["sent", "viewed", "negotiation"].includes(p.status) && (
                  <div className="flex gap-2">
                    <button onClick={() => mRespond.mutate({ id: p.id, status: "accepted" })} className="h-8 px-3 rounded bg-academy text-white text-xs">Accept</button>
                    <button onClick={() => mRespond.mutate({ id: p.id, status: "negotiation" })} className="h-8 px-3 rounded ring-1 ring-border text-xs">Request revision</button>
                    <button onClick={() => mRespond.mutate({ id: p.id, status: "rejected" })} className="h-8 px-3 rounded ring-1 ring-border text-xs text-red-600">Reject</button>
                  </div>
                )}
              </div>
            </li>
          ))}
          {proposals.length === 0 && <li className="text-sm text-muted-foreground">No proposals yet.</li>}
        </ul>
      </div>

      <div className="ring-1 ring-border rounded-2xl bg-card p-5">
        <h3 className="font-display text-lg font-medium text-ink mb-3">Contracts</h3>
        <ul className="space-y-2">
          {contracts.map((c: any) => (
            <li key={c.id} className="ring-1 ring-border rounded-xl bg-background p-3 flex items-center gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="text-ink font-medium truncate">{c.title}</div>
                <div className="text-xs text-muted-foreground">
                  {c.status}
                  {c.total_amount ? ` · ${c.currency} ${Number(c.total_amount).toLocaleString()}` : ""}
                  {c.effective_date ? ` · effective ${c.effective_date}` : ""}
                </div>
              </div>
              {c.pdf_url && (
                <button onClick={() => openSigned(c.pdf_url)} className="h-8 px-3 rounded ring-1 ring-border text-xs">Download PDF</button>
              )}
            </li>
          ))}
          {contracts.length === 0 && <li className="text-sm text-muted-foreground">No contracts yet.</li>}
        </ul>
      </div>
    </div>
  );
}
