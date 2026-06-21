import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listMyNotifications,
  markRead,
  markAllRead,
  archiveNotification,
} from "@/lib/notifications.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Archive, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NotificationRow } from "@/lib/notifications/types";

export const Route = createFileRoute("/_authenticated/dashboard/notifications")({
  component: NotificationsPage,
  errorComponent: ({ error }) => (
    <div className="p-6 text-sm text-destructive">{error.message}</div>
  ),
  notFoundComponent: () => <div className="p-6">Not found.</div>,
});

function NotificationsPage() {
  const qc = useQueryClient();
  const list = useServerFn(listMyNotifications);
  const mark = useServerFn(markRead);
  const markAll = useServerFn(markAllRead);
  const archive = useServerFn(archiveNotification);

  const { data: items = [], isLoading } = useQuery<NotificationRow[]>({
    queryKey: ["notifications", "all"],
    queryFn: async () =>
      (await list({ data: { limit: 100 } })) as NotificationRow[],
  });

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["notifications"] });

  const markMut = useMutation({
    mutationFn: (id: string) => mark({ data: { id } }),
    onSuccess: invalidate,
  });
  const archiveMut = useMutation({
    mutationFn: (id: string) => archive({ data: { id } }),
    onSuccess: invalidate,
  });
  const markAllMut = useMutation({
    mutationFn: () => markAll(),
    onSuccess: invalidate,
  });

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold text-ink">
            Notifications
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Updates from across the HIGAET ecosystem.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/dashboard/notifications/preferences">Preferences</Link>
          </Button>
          <Button
            size="sm"
            disabled={markAllMut.isPending}
            onClick={() => markAllMut.mutate()}
          >
            Mark all read
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : items.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg p-12 text-center text-sm text-muted-foreground">
          You don't have any notifications yet.
        </div>
      ) : (
        <ul className="divide-y divide-border border border-border rounded-lg overflow-hidden bg-surface">
          {items.map((n) => (
            <li
              key={n.id}
              className={cn(
                "p-4 flex items-start gap-3",
                !n.read_at && "bg-primary/[0.04]",
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-sm text-ink">{n.title}</h3>
                  <Badge variant="outline" className="text-[10px]">
                    {n.category}
                  </Badge>
                  {n.priority !== "normal" && (
                    <Badge variant="secondary" className="text-[10px]">
                      {n.priority}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{n.body}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span>{new Date(n.created_at).toLocaleString()}</span>
                  {n.action_url && (
                    <Link
                      to={n.action_url}
                      className="text-primary hover:underline"
                    >
                      Open
                    </Link>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {!n.read_at && (
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Mark read"
                    onClick={() => markMut.mutate(n.id)}
                  >
                    <Check className="size-4" />
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Archive"
                  onClick={() => archiveMut.mutate(n.id)}
                >
                  <Archive className="size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
