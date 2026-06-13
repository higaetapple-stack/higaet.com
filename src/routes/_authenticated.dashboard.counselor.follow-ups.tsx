import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { myFollowUps } from "@/lib/counselor.functions";
import { updateCrmFollowUp } from "@/lib/crm.functions";

export const Route = createFileRoute("/_authenticated/dashboard/counselor/follow-ups")({
  component: MyFollowUps,
});

const VIEWS = [
  { v: "today", l: "Today" },
  { v: "week", l: "This week" },
  { v: "overdue", l: "Overdue" },
  { v: "all", l: "All" },
] as const;

function MyFollowUps() {
  const fn = useServerFn(myFollowUps);
  const setFu = useServerFn(updateCrmFollowUp);
  const qc = useQueryClient();
  const [view, setView] = useState<(typeof VIEWS)[number]["v"]>("today");

  const q = useQuery({
    queryKey: ["my-followups", view],
    queryFn: () => fn({ data: { view } }),
  });
  const m = useMutation({
    mutationFn: (v: { id: string; status: any }) => setFu({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-followups"] });
      qc.invalidateQueries({ queryKey: ["counselor-kpis"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {VIEWS.map((v) => (
          <button
            key={v.v}
            onClick={() => setView(v.v)}
            className={`px-3 h-9 rounded text-sm ring-1 ring-border ${view === v.v ? "bg-academy text-white" : "bg-background text-muted-foreground hover:text-ink"}`}
          >
            {v.l}
          </button>
        ))}
      </div>
      <ul className="space-y-2">
        {q.isLoading && <li className="text-sm text-muted-foreground">Loading…</li>}
        {(q.data ?? []).map((f: any) => (
          <li
            key={f.id}
            className="ring-1 ring-border rounded-xl bg-card p-3 flex items-center gap-3"
          >
            <div className="flex-1">
              <div className="text-ink">
                {new Date(f.scheduled_at).toLocaleString()} · {f.channel}
              </div>
              <div className="text-xs text-muted-foreground">
                {f.entity_type} · {f.status}
                {f.notes ? ` · ${f.notes}` : ""}
              </div>
            </div>
            <select
              value={f.status}
              onChange={(e) => m.mutate({ id: f.id, status: e.target.value as any })}
              className="h-8 rounded ring-1 ring-border px-2 text-xs bg-background"
            >
              <option value="scheduled">scheduled</option>
              <option value="done">done</option>
              <option value="missed">missed</option>
              <option value="cancelled">cancelled</option>
            </select>
          </li>
        ))}
        {!q.isLoading && (q.data ?? []).length === 0 && (
          <li className="text-sm text-muted-foreground">No follow-ups here.</li>
        )}
      </ul>
    </div>
  );
}
