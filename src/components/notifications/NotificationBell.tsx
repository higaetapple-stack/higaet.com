import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, Check, CheckCheck } from "lucide-react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  listMyNotifications,
  markRead,
  markAllRead,
} from "@/lib/notifications.functions";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { NotificationRow } from "@/lib/notifications/types";

export function NotificationBell() {
  const qc = useQueryClient();
  const fetchList = useServerFn(listMyNotifications);
  const markOne = useServerFn(markRead);
  const markAll = useServerFn(markAllRead);
  const [open, setOpen] = useState(false);

  const { data: items = [] } = useQuery<NotificationRow[]>({
    queryKey: ["notifications", "recent"],
    queryFn: () => fetchList({ data: { limit: 20 } }),
    staleTime: 30_000,
  });

  // Realtime subscription
  useEffect(() => {
    let userId: string | undefined;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      const { data } = await supabase.auth.getUser();
      userId = data.user?.id;
      if (!userId) return;
      channel = supabase
        .channel(`notifications:${userId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userId}`,
          },
          () => {
            qc.invalidateQueries({ queryKey: ["notifications"] });
          },
        )
        .subscribe();
    })();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [qc]);

  const unread = items.filter((n) => !n.read_at).length;

  const markOneMut = useMutation({
    mutationFn: (id: string) => markOne({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const markAllMut = useMutation({
    mutationFn: () => markAll(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          aria-label={`Notifications (${unread} unread)`}
          className="relative inline-flex items-center justify-center size-9 rounded-md hover:bg-muted text-ink"
        >
          <Bell className="size-5" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-medium flex items-center justify-center">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[380px] p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-sm text-ink">Notifications</h3>
          <Button
            size="sm"
            variant="ghost"
            disabled={unread === 0 || markAllMut.isPending}
            onClick={() => markAllMut.mutate()}
            className="h-7 gap-1.5 text-xs"
          >
            <CheckCheck className="size-3.5" />
            Mark all read
          </Button>
        </div>
        <ScrollArea className="h-[420px]">
          {items.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-muted-foreground">
              You're all caught up.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((n) => (
                <li
                  key={n.id}
                  className={cn(
                    "px-4 py-3 hover:bg-muted/50 transition-colors",
                    !n.read_at && "bg-primary/[0.04]",
                  )}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      {n.action_url ? (
                        <Link
                          to={n.action_url}
                          onClick={() => {
                            if (!n.read_at) markOneMut.mutate(n.id);
                            setOpen(false);
                          }}
                          className="font-medium text-sm text-ink hover:underline block truncate"
                        >
                          {n.title}
                        </Link>
                      ) : (
                        <p className="font-medium text-sm text-ink truncate">
                          {n.title}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {n.body}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wide">
                        {new Date(n.created_at).toLocaleString()}
                      </p>
                    </div>
                    {!n.read_at && (
                      <button
                        onClick={() => markOneMut.mutate(n.id)}
                        aria-label="Mark read"
                        className="text-muted-foreground hover:text-ink p-1"
                      >
                        <Check className="size-3.5" />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
        <div className="border-t border-border px-4 py-2 text-center">
          <Link
            to="/dashboard/notifications"
            onClick={() => setOpen(false)}
            className="text-xs text-primary hover:underline"
          >
            View all
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
