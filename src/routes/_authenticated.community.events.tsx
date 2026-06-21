import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listEvents } from "@/lib/community.functions";
import { ArrowLeft, Calendar, MapPin, Video, Users } from "lucide-react";
import type { EventRow } from "@/lib/community/types";

export const Route = createFileRoute("/_authenticated/community/events")({
  component: EventsList,
  errorComponent: ({ error }) => <div className="p-6 text-sm text-destructive">{error.message}</div>,
  notFoundComponent: () => <div className="p-6">Not found.</div>,
});

function EventsList() {
  const list = useServerFn(listEvents);
  const { data: events = [] } = useQuery<EventRow[]>({
    queryKey: ["events", "upcoming"],
    queryFn: () => list({ data: { upcomingOnly: true } }) as Promise<EventRow[]>,
  });

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Link to="/community" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-ink">
        <ArrowLeft className="size-4" /> Community
      </Link>
      <header>
        <h1 className="text-2xl font-display font-semibold text-ink">Upcoming events</h1>
        <p className="text-sm text-muted-foreground mt-1">Webinars, cohort orientations, workshops and meetups.</p>
      </header>

      <ul className="space-y-3">
        {events.map((e) => (
          <li key={e.id}>
            <Link
              to="/community/events/$id"
              params={{ id: e.id }}
              className="block border border-border rounded-lg p-4 bg-surface hover:border-primary/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-medium text-ink">{e.title}</h3>
                  {e.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{e.description}</p>}
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="size-3.5" />
                      {new Date(e.starts_at).toLocaleString()}
                    </span>
                    {e.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3.5" /> {e.location}
                      </span>
                    )}
                    {e.virtual_url && (
                      <span className="inline-flex items-center gap-1">
                        <Video className="size-3.5" /> Virtual
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Users className="size-3.5" /> {e.rsvp_count} going
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </li>
        ))}
        {events.length === 0 && (
          <li className="border border-dashed border-border rounded-lg p-12 text-center text-sm text-muted-foreground">
            No upcoming events.
          </li>
        )}
      </ul>
    </div>
  );
}
