import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import {
  getCrmEntity,
  listCrmThread,
  updateCrmStatus,
  assignCounselor,
  addCrmNote,
  addCrmTask,
  updateCrmTask,
  addCrmFollowUp,
  updateCrmFollowUp,
  listStaffMembers,
} from "@/lib/crm.functions";

export const Route = createFileRoute("/_authenticated/dashboard/admin/crm/$type/$id")({
  component: CrmDetail,
});

const STAGES = ["new", "contacted", "qualified", "in_progress", "converted", "closed"];

function CrmDetail() {
  const { type, id } = Route.useParams();
  const entityType = type as any;
  const qc = useQueryClient();
  const getEntity = useServerFn(getCrmEntity);
  const getThread = useServerFn(listCrmThread);
  const getStaff = useServerFn(listStaffMembers);
  const setStatus = useServerFn(updateCrmStatus);
  const setAssignee = useServerFn(assignCounselor);
  const addNote = useServerFn(addCrmNote);
  const addTask = useServerFn(addCrmTask);
  const setTask = useServerFn(updateCrmTask);
  const addFu = useServerFn(addCrmFollowUp);
  const setFu = useServerFn(updateCrmFollowUp);

  const entityQ = useQuery({
    queryKey: ["crm-entity", type, id],
    queryFn: () => getEntity({ data: { entity_type: entityType, entity_id: id } }),
  });
  const threadQ = useQuery({
    queryKey: ["crm-thread", type, id],
    queryFn: () => getThread({ data: { entity_type: entityType, entity_id: id } }),
  });
  const staffQ = useQuery({ queryKey: ["crm-staff"], queryFn: () => getStaff() });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["crm-entity", type, id] });
    qc.invalidateQueries({ queryKey: ["crm-thread", type, id] });
    qc.invalidateQueries({ queryKey: ["crm-inbox"] });
  };

  const statusM = useMutation({
    mutationFn: (crm_status: string) =>
      setStatus({
        data: { entity_type: entityType, entity_id: id, crm_status: crm_status as any },
      }),
    onSuccess: () => {
      toast.success("Stage updated");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const assignM = useMutation({
    mutationFn: (user_id: string | null) =>
      setAssignee({ data: { entity_type: entityType, entity_id: id, user_id } }),
    onSuccess: () => {
      toast.success("Assignment updated");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [note, setNote] = useState("");
  const noteM = useMutation({
    mutationFn: (n: string) =>
      addNote({ data: { entity_type: entityType, entity_id: id, note: n } }),
    onSuccess: () => {
      setNote("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [taskAssign, setTaskAssign] = useState("");
  const taskM = useMutation({
    mutationFn: () =>
      addTask({
        data: {
          entity_type: entityType,
          entity_id: id,
          title: taskTitle,
          due_date: taskDue || null,
          assigned_to: taskAssign || null,
        },
      }),
    onSuccess: () => {
      setTaskTitle("");
      setTaskDue("");
      setTaskAssign("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const taskUpdateM = useMutation({
    mutationFn: (v: { id: string; status: any }) => setTask({ data: v }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const [fuAt, setFuAt] = useState("");
  const [fuChannel, setFuChannel] = useState<"email" | "phone" | "whatsapp" | "meeting" | "other">(
    "email",
  );
  const fuM = useMutation({
    mutationFn: () =>
      addFu({
        data: {
          entity_type: entityType,
          entity_id: id,
          scheduled_at: new Date(fuAt).toISOString(),
          channel: fuChannel,
        },
      }),
    onSuccess: () => {
      setFuAt("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const fuUpdateM = useMutation({
    mutationFn: (v: { id: string; status: any }) => setFu({ data: v }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const entity: any = entityQ.data;
  const thread = threadQ.data ?? { notes: [], tasks: [], followUps: [], activity: [] };
  const canAssign =
    type === "study_abroad_lead" ||
    type === "tech_lead" ||
    type === "application" ||
    type === "generic_lead";
  const assignedField =
    type === "tech_lead" || type === "generic_lead" ? "assigned_to" : "assigned_to_counselor";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-sm">
        <Link to="/dashboard/admin/crm" className="text-muted-foreground hover:text-ink">
          ← Back to CRM
        </Link>
        <span className="text-muted-foreground">·</span>
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{type}</span>
      </div>

      {entityQ.isLoading || !entity ? (
        <p className="text-sm text-muted-foreground">Loading record…</p>
      ) : (
        <>
          <div className="ring-1 ring-border rounded-2xl bg-card p-6">
            <h1 className="font-display text-xl text-ink">
              {entity.full_name ?? entity.job_title ?? entity.id}
            </h1>
            {entity.email && <div className="text-sm text-muted-foreground">{entity.email}</div>}
            {entity.phone && <div className="text-sm text-muted-foreground">{entity.phone}</div>}
            {entity.company && (
              <div className="text-sm text-muted-foreground">{entity.company}</div>
            )}
            {type === "generic_lead" && (entity.division || entity.source) && (
              <div className="text-sm text-muted-foreground">
                {[entity.division, entity.source].filter(Boolean).join(" · ")}
              </div>
            )}
            {entity.message && (
              <p className="text-sm mt-3 text-muted-foreground border-l-2 border-border pl-3">
                {entity.message}
              </p>
            )}

            <div className="grid sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground">
                  CRM stage
                </label>
                <select
                  value={entity.crm_status ?? "new"}
                  onChange={(e) => statusM.mutate(e.target.value)}
                  className="mt-1 w-full h-9 rounded ring-1 ring-border px-2 text-sm bg-background"
                >
                  {STAGES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              {entity.status && (
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Module status
                  </label>
                  <div className="mt-1 h-9 flex items-center text-sm">{entity.status}</div>
                </div>
              )}
              {canAssign && (
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Assigned to
                  </label>
                  <select
                    value={entity[assignedField] ?? ""}
                    onChange={(e) => assignM.mutate(e.target.value || null)}
                    className="mt-1 w-full h-9 rounded ring-1 ring-border px-2 text-sm bg-background"
                  >
                    <option value="">Unassigned</option>
                    {(staffQ.data ?? []).map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.full_name || s.email}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Notes */}
            <div className="ring-1 ring-border rounded-2xl bg-card p-5">
              <h3 className="font-medium text-ink mb-3">Notes</h3>
              <div className="flex gap-2 mb-4">
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add a note…"
                  className="flex-1 h-9 rounded ring-1 ring-border px-3 text-sm bg-background"
                />
                <button
                  disabled={!note.trim() || noteM.isPending}
                  onClick={() => noteM.mutate(note)}
                  className="h-9 px-3 rounded bg-academy text-white text-sm disabled:opacity-50"
                >
                  Add
                </button>
              </div>
              <ul className="space-y-3">
                {thread.notes.map((n: any) => (
                  <li key={n.id} className="text-sm border-l-2 border-border pl-3">
                    <div className="text-ink whitespace-pre-wrap">{n.note}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {n.author?.full_name ?? "Staff"} · {new Date(n.created_at).toLocaleString()}
                    </div>
                  </li>
                ))}
                {thread.notes.length === 0 && (
                  <li className="text-sm text-muted-foreground">No notes yet.</li>
                )}
              </ul>
            </div>

            {/* Tasks */}
            <div className="ring-1 ring-border rounded-2xl bg-card p-5">
              <h3 className="font-medium text-ink mb-3">Tasks</h3>
              <div className="space-y-2 mb-4">
                <input
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Task title"
                  className="w-full h-9 rounded ring-1 ring-border px-3 text-sm bg-background"
                />
                <div className="flex gap-2">
                  <input
                    type="datetime-local"
                    value={taskDue}
                    onChange={(e) => setTaskDue(e.target.value)}
                    className="flex-1 h-9 rounded ring-1 ring-border px-3 text-sm bg-background"
                  />
                  <select
                    value={taskAssign}
                    onChange={(e) => setTaskAssign(e.target.value)}
                    className="flex-1 h-9 rounded ring-1 ring-border px-2 text-sm bg-background"
                  >
                    <option value="">Unassigned</option>
                    {(staffQ.data ?? []).map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.full_name || s.email}
                      </option>
                    ))}
                  </select>
                  <button
                    disabled={!taskTitle.trim() || taskM.isPending}
                    onClick={() => taskM.mutate()}
                    className="h-9 px-3 rounded bg-academy text-white text-sm disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              </div>
              <ul className="space-y-2">
                {thread.tasks.map((t: any) => (
                  <li key={t.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={t.status === "done"}
                      onChange={(e) =>
                        taskUpdateM.mutate({
                          id: t.id,
                          status: e.target.checked ? "done" : "open",
                        })
                      }
                    />
                    <div className="flex-1">
                      <div
                        className={
                          t.status === "done" ? "line-through text-muted-foreground" : "text-ink"
                        }
                      >
                        {t.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {t.due_date
                          ? `Due ${new Date(t.due_date).toLocaleDateString()}`
                          : "No due date"}
                        {t.assignee?.full_name ? ` · ${t.assignee.full_name}` : ""}
                      </div>
                    </div>
                  </li>
                ))}
                {thread.tasks.length === 0 && (
                  <li className="text-sm text-muted-foreground">No tasks yet.</li>
                )}
              </ul>
            </div>

            {/* Follow-ups */}
            <div className="ring-1 ring-border rounded-2xl bg-card p-5">
              <h3 className="font-medium text-ink mb-3">Follow-ups</h3>
              <div className="flex gap-2 mb-4">
                <input
                  type="datetime-local"
                  value={fuAt}
                  onChange={(e) => setFuAt(e.target.value)}
                  className="flex-1 h-9 rounded ring-1 ring-border px-3 text-sm bg-background"
                />
                <select
                  value={fuChannel}
                  onChange={(e) => setFuChannel(e.target.value as any)}
                  className="h-9 rounded ring-1 ring-border px-2 text-sm bg-background"
                >
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="meeting">Meeting</option>
                  <option value="other">Other</option>
                </select>
                <button
                  disabled={!fuAt || fuM.isPending}
                  onClick={() => fuM.mutate()}
                  className="h-9 px-3 rounded bg-academy text-white text-sm disabled:opacity-50"
                >
                  Schedule
                </button>
              </div>
              <ul className="space-y-2">
                {thread.followUps.map((f: any) => (
                  <li key={f.id} className="text-sm flex items-center gap-2">
                    <div className="flex-1">
                      <div className="text-ink">
                        {new Date(f.scheduled_at).toLocaleString()} · {f.channel}
                      </div>
                      <div className="text-xs text-muted-foreground">{f.status}</div>
                    </div>
                    <select
                      value={f.status}
                      onChange={(e) =>
                        fuUpdateM.mutate({ id: f.id, status: e.target.value as any })
                      }
                      className="h-8 rounded ring-1 ring-border px-2 text-xs bg-background"
                    >
                      <option value="scheduled">scheduled</option>
                      <option value="done">done</option>
                      <option value="missed">missed</option>
                      <option value="cancelled">cancelled</option>
                    </select>
                  </li>
                ))}
                {thread.followUps.length === 0 && (
                  <li className="text-sm text-muted-foreground">No follow-ups scheduled.</li>
                )}
              </ul>
            </div>

            {/* Activity */}
            <div className="ring-1 ring-border rounded-2xl bg-card p-5">
              <h3 className="font-medium text-ink mb-3">Activity timeline</h3>
              <ul className="space-y-3">
                {thread.activity.map((a: any) => (
                  <li key={a.id} className="text-sm border-l-2 border-border pl-3">
                    <div className="text-ink">{a.description ?? a.event_type}</div>
                    <div className="text-xs text-muted-foreground">
                      {a.actor?.full_name ?? "System"} · {new Date(a.created_at).toLocaleString()}
                    </div>
                  </li>
                ))}
                {thread.activity.length === 0 && (
                  <li className="text-sm text-muted-foreground">No activity logged yet.</li>
                )}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
