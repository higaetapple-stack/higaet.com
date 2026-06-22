import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { counselorPipeline, setApplicationWorkflowStatus } from "@/lib/counselor.functions";

export const Route = createFileRoute("/_authenticated/dashboard/counselor/pipeline")({
  component: PipelineBoard,
});

const LABELS: Record<string, string> = {
  lead: "Lead",
  qualified: "Qualified",
  documents_pending: "Documents Pending",
  application_submitted: "Application Submitted",
  offer_received: "Offer Received",
  visa_processing: "Visa Processing",
  completed: "Completed",
  closed_lost: "Closed Lost",
};

function PipelineBoard() {
  const fn = useServerFn(counselorPipeline);
  const move = useServerFn(setApplicationWorkflowStatus);
  const qc = useQueryClient();
  const [scope, setScope] = useState<"me" | "all">("me");
  const [dragging, setDragging] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ["counselor-pipeline", scope],
    queryFn: () => fn({ data: { scope } }),
  });

  const m = useMutation({
    mutationFn: (v: { id: string; to_status: any }) => move({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["counselor-pipeline"] });
      qc.invalidateQueries({ queryKey: ["counselor-kpis"] });
      toast.success("Status updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const statuses = q.data?.statuses ?? [];
  const groups: Record<string, any[]> = (q.data?.groups ?? {}) as any;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {(["me", "all"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setScope(s)}
              className={`px-3 h-9 rounded text-sm ring-1 ring-border ${scope === s ? "bg-academy text-white" : "bg-background text-muted-foreground hover:text-ink"}`}
            >
              {s === "me" ? "My pipeline" : "All counselors"}
            </button>
          ))}
        </div>
        <div className="text-xs text-muted-foreground">Drag a card to a new column to update its workflow status.</div>
      </div>
      <div className="grid grid-flow-col auto-cols-[280px] gap-3 overflow-x-auto pb-4">
        {statuses.map((s: string) => (
          <div
            key={s}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const id = e.dataTransfer.getData("text/plain") || dragging;
              if (id) m.mutate({ id, to_status: s });
              setDragging(null);
            }}
            className="rounded-xl bg-muted/30 ring-1 ring-border p-3 min-h-[200px]"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-ink">{LABELS[s] ?? s}</h3>
              <span className="text-xs text-muted-foreground">{(groups[s] ?? []).length}</span>
            </div>
            <div className="space-y-2">
              {(groups[s] ?? []).map((app: any) => (
                <div
                  key={app.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", app.id);
                    setDragging(app.id);
                  }}
                  onDragEnd={() => setDragging(null)}
                  className="rounded-lg bg-card ring-1 ring-border p-3 cursor-grab active:cursor-grabbing"
                >
                  <Link
                    to="/dashboard/counselor/timeline/$id"
                    params={{ id: app.id }}
                    className="text-sm font-medium text-ink hover:underline block"
                  >
                    {app.profiles?.full_name ?? app.profiles?.email ?? "Student"}
                  </Link>
                  <div className="text-xs text-muted-foreground mt-1">
                    {app.universities?.name ?? "—"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {app.university_programs?.name ?? app.university_programs?.title ?? ""}
                    {app.intake ? ` · ${app.intake}` : ""}
                  </div>
                </div>
              ))}
              {(groups[s] ?? []).length === 0 && (
                <div className="text-xs text-muted-foreground italic">No applications</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
