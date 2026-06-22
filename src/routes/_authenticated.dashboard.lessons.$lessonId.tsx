import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getLesson, markLessonComplete } from "@/lib/learn.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, CheckCircle2, Download, PlayCircle } from "lucide-react";
import { AiTutor } from "@/components/ai/AiTutor";

export const Route = createFileRoute("/_authenticated/dashboard/lessons/$lessonId")({
  component: LessonPlayer,
});

function getEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (u.hostname === "youtu.be") {
      return `https://www.youtube.com/embed${u.pathname}`;
    }
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean)[0];
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
  } catch {
    return null;
  }
  return null;
}

function LessonPlayer() {
  const { lessonId } = Route.useParams();
  const fetchLesson = useServerFn(getLesson);
  const mark = useServerFn(markLessonComplete);
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["lesson", lessonId],
    queryFn: () => fetchLesson({ data: { id: lessonId } }),
  });

  const completeMut = useMutation({
    mutationFn: async () => mark({ data: { lessonId } }),
    onSuccess: () => {
      toast.success("Lesson completed");
      qc.invalidateQueries({ queryKey: ["lesson", lessonId] });
      qc.invalidateQueries({ queryKey: ["program-detail"] });
      qc.invalidateQueries({ queryKey: ["course-detail"] });
      qc.invalidateQueries({ queryKey: ["my-programs"] });
      qc.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (error || !data) return <p className="text-sm text-muted-foreground">Lesson not found.</p>;

  const { lesson, prev, next, completed } = data;
  const program = (lesson as any).courses?.programs;
  const course = (lesson as any).courses;
  const videoEmbed = lesson.video_url ? getEmbedUrl(lesson.video_url) : null;
  const isDirectVideo = !!lesson.video_url && !videoEmbed;
  const paragraphs: string[] = (lesson.content_md ?? "").split(/\n{2,}/).filter(Boolean);
  const resources: { label: string; url: string }[] = Array.isArray(lesson.resources)
    ? (lesson.resources as unknown as { label: string; url: string }[])
    : [];

  return (
    <div className="max-w-4xl">
      <div className="mb-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <Link
          to="/dashboard/courses/$courseId"
          params={{ courseId: lesson.course_id }}
          className="inline-flex items-center gap-1 hover:text-ink"
        >
          <ArrowLeft className="size-3.5" /> {course?.title}
        </Link>
        {program && (
          <Link to="/dashboard/programs/$slug" params={{ slug: program.slug }} className="hover:text-ink">
            {program.title}
          </Link>
        )}
      </div>

      <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden">
        {videoEmbed && (
          <div className="aspect-video bg-black">
            <iframe
              src={videoEmbed}
              className="size-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={lesson.title}
            />
          </div>
        )}
        {isDirectVideo && (
          <div className="aspect-video bg-black">
            <video src={lesson.video_url!} controls className="size-full" />
          </div>
        )}
        {!lesson.video_url && (
          <div className="aspect-video bg-muted grid place-items-center text-muted-foreground">
            <PlayCircle className="size-12 opacity-40" />
          </div>
        )}

        <div className="p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Badge variant="secondary" className="capitalize">{lesson.lesson_type}</Badge>
              <h1 className="font-display text-2xl font-medium text-ink mt-2">{lesson.title}</h1>
              {lesson.duration_min && (
                <div className="text-xs text-muted-foreground mt-1">{lesson.duration_min} min</div>
              )}
            </div>
            {completed && (
              <Badge className="bg-academy/10 text-academy hover:bg-academy/15">
                <CheckCircle2 className="size-3.5" /> Completed
              </Badge>
            )}
          </div>

          {paragraphs.length > 0 && (
            <div className="mt-5 space-y-3 text-sm text-ink/90 leading-relaxed">
              {paragraphs.map((p, i) => (
                <p key={i} className="whitespace-pre-wrap">{p}</p>
              ))}
            </div>
          )}

          {resources.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Resources</h3>
              <ul className="space-y-1.5">
                {resources.map((r, i) => (
                  <li key={i}>
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-academy hover:underline"
                    >
                      <Download className="size-3.5" /> {r.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" disabled={!prev}>
          {prev ? (
            <Link to="/dashboard/lessons/$lessonId" params={{ lessonId: prev.id }}>
              <ArrowLeft className="size-4" /> Previous
            </Link>
          ) : (
            <span><ArrowLeft className="size-4" /> Previous</span>
          )}
        </Button>

        <Button
          onClick={() => completeMut.mutate()}
          disabled={completed || completeMut.isPending}
          className="bg-academy text-academy-foreground hover:bg-academy/90"
        >
          {completed ? "Completed" : completeMut.isPending ? "Saving…" : "Mark complete"}
        </Button>

        <Button asChild variant="ghost" size="sm" disabled={!next}>
          {next ? (
            <Link to="/dashboard/lessons/$lessonId" params={{ lessonId: next.id }}>
              Next <ArrowRight className="size-4" />
            </Link>
          ) : (
            <span>Next <ArrowRight className="size-4" /></span>
          )}
        </Button>
      </div>

      <section className="mt-8">
        <h2 className="font-display text-lg text-ink mb-3">Ask the AI Tutor</h2>
        <AiTutor lessonId={lesson.id} />
      </section>
    </div>
  );
}
