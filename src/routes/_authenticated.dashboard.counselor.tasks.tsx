import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { myTasks } from "@/lib/counselor.functions";
import { updateCrmTask } from "@/lib/crm.functions";

export const Route = createFileRoute("/_authenticated/dashboard/counselor/tasks")({
  component: MyTasks,
});

const VIEWS = [
  { v: "today", l: "Today" },
  { v: "week", l: "This week" },
  { v: "overdue", l: "Overdue" },
  { v: "all", l: "All" },
] as const;

function MyTasks() {
  const fn = useServerFn(myTasks);
  const setTask = useServerFn(updateCrmTask);
  const qc = useQueryClient();
  const [view, setView] = useState<(typeof VIEWS)[number]["v"]>("today");

  const q = useQuery({
    queryKey: ["my-tasks", view],
    queryFn: () => fn({ data: { view } }),
  });

  const m = useMutation({
    mutationFn: (v: { id: string; status: any }) => setTask({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-tasks"] });
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
        {(q.data ?? []).map((t: any) => (
          <li
            key={t.id}
            className="ring-1 ring-border rounded-xl bg-card p-3 flex items-center gap-3"
          >
            <input
              type="checkbox"
              checked={t.status === "done"}
              onChange={(e) =>
                m.mutate({ id: t.id, status: e.target.checked ? "done" : "open" })
              }
            />
            <div className="flex-1">
              <div className={t.status === "done" ? "line-through text-muted-foreground" : "text-ink"}>
                {t.title}
              </div>
              <div className="text-xs text-muted-foreground">
                {t.entity_type} ·{" "}
                {t.due_date ? `Due ${new Date(t.due_date).toLocaleString()}` : "No due date"}
              </div>
            </div>
            <select
              value={t.status}
              onChange={(e) => m.mutate({ id: t.id, status: e.target.value })}
              className="h-8 rounded ring-1 ring-border px-2 text-xs bg-background"
            >
              <option value="open">open</option>
              <option value="in_progress">in progress</option>
              <option value="done">done</option>
              <option value="cancelled">cancelled</option>
            </select>
          </li>
        ))}
        {!q.isLoading && (q.data ?? []).length === 0 && (
          <li className="text-sm text-muted-foreground">Nothing here. Nice work.</li>
        )}
      </ul>
    </div>
  );
}
