import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getEvent, setRsvp, cancelRsvp } from "@/lib/community.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, MapPin, Video, Users } from "lucide-react";
import type { EventRow, EventRsvpRow, EventRsvpStatus } from "@/lib/community/types";

export const Route = createFileRoute("/_authenticated/community/events/$id")({
  component: EventDetail,
  errorComponent: ({ error }) => <div className="p-6 text-sm text-destructive">{error.message}</div>,
  notFoundComponent: () => <div className="p-6">Event not found.</div>,
});

function EventDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const get = useServerFn(getEvent);
  const setR = useServerFn(setRsvp);
  const cancel = useServerFn(cancelRsvp);

  const { data } = useQuery<{ event: EventRow; myRsvp: EventRsvpRow | null }>({
    queryKey: ["event", id],
    queryFn: () => get({ data: { id } }) as Promise<{ event: EventRow; myRsvp: EventRsvpRow | null }>,
  });

  const setMut = useMutation({
    mutationFn: (status: EventRsvpStatus) => setR({ data: { eventId: id, status } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["event", id] }),
  });
  const cancelMut = useMutation({
    mutationFn: () => cancel({ data: { eventId: id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["event", id] }),
  });

  if (!data) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
  const { event: e, myRsvp } = data;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <Link to="/community/events" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-ink">
        <ArrowLeft className="size-4" /> Events
      </Link>

      <article className="border border-border rounded-lg p-6 bg-surface space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-semibold text-ink">{e.title}</h1>
            <Badge variant="outline" className="mt-2 text-[10px] capitalize">{e.status}</Badge>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <Row icon={<Calendar className="size-4" />} label="Starts">{new Date(e.starts_at).toLocaleString()}</Row>
          <Row icon={<Calendar className="size-4" />} label="Ends">{new Date(e.ends_at).toLocaleString()}</Row>
          {e.location && <Row icon={<MapPin className="size-4" />} label="Location">{e.location}</Row>}
          {e.virtual_url && (
            <Row icon={<Video className="size-4" />} label="Virtual">
              <a href={e.virtual_url} className="text-primary hover:underline" target="_blank" rel="noreferrer">
                Join link
              </a>
            </Row>
          )}
          <Row icon={<Users className="size-4" />} label="Going">
            {e.rsvp_count}{e.capacity ? ` / ${e.capacity}` : ""}
          </Row>
        </div>

        {e.description && <p className="text-sm text-ink whitespace-pre-wrap pt-2 border-t border-border">{e.description}</p>}

        <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
          <Button
            variant={myRsvp?.status === "going" ? "default" : "outline"}
            onClick={() => setMut.mutate("going")}
            disabled={setMut.isPending}
          >
            Going
          </Button>
          <Button
            variant={myRsvp?.status === "maybe" ? "default" : "outline"}
            onClick={() => setMut.mutate("maybe")}
            disabled={setMut.isPending}
          >
            Maybe
          </Button>
          <Button
            variant={myRsvp?.status === "declined" ? "default" : "outline"}
            onClick={() => setMut.mutate("declined")}
            disabled={setMut.isPending}
          >
            Can't go
          </Button>
          {myRsvp && (
            <Button variant="ghost" onClick={() => cancelMut.mutate()} disabled={cancelMut.isPending}>
              Cancel RSVP
            </Button>
          )}
        </div>
      </article>
    </div>
  );
}

function Row({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-muted-foreground mt-0.5">{icon}</span>
      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="text-ink">{children}</div>
      </div>
    </div>
  );
}
