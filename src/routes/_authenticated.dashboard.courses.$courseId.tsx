import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCourseDetail } from "@/lib/learn.functions";
import { ProgressBar } from "@/components/lms/ProgressBar";
import { FacultyCard } from "@/components/lms/FacultyCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, Circle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/courses/$courseId")({
  component: CourseDetail,
});

function CourseDetail() {
  const { courseId } = Route.useParams();
  const fetchDetail = useServerFn(getCourseDetail);
  const { data, isLoading, error } = useQuery({
    queryKey: ["course-detail", courseId],
    queryFn: () => fetchDetail({ data: { id: courseId } }),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (error || !data) {
    return <p className="text-sm text-muted-foreground">Course not found.</p>;
  }
  const { course, lessons, faculty, progress } = data;

  return (
    <div className="max-w-4xl">
      <Button asChild variant="ghost" size="sm" className="mb-3">
        <Link to="/dashboard/programs/$slug" params={{ slug: course.programs?.slug ?? "" }}>
          <ArrowLeft className="size-4" /> {course.programs?.title ?? "Back"}
        </Link>
      </Button>

      <div className="rounded-2xl bg-card ring-1 ring-border p-6 mb-6">
        <div className="text-xs text-muted-foreground">Course</div>
        <h1 className="font-display text-2xl font-medium text-ink mt-1">{course.title}</h1>
        {course.description && (
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">{course.description}</p>
        )}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>{progress.pct}% complete</span>
            <span>{progress.done} / {progress.total} lessons</span>
          </div>
          <ProgressBar value={progress.pct} />
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-6">
        <div>
          <h2 className="font-display text-lg font-medium text-ink mb-3">Lessons</h2>
          <ul className="rounded-xl bg-card ring-1 ring-border divide-y divide-border overflow-hidden">
            {lessons.length === 0 && <li className="p-4 text-sm text-muted-foreground">No lessons yet.</li>}
            {lessons.map((l: any) => {
              const Icon = l.completed ? CheckCircle2 : Circle;
              return (
                <li key={l.id} className="p-3 flex items-center justify-between">
                  <Link
                    to="/dashboard/lessons/$lessonId"
                    params={{ lessonId: l.id }}
                    className="flex items-center gap-2 text-sm text-ink hover:text-academy min-w-0"
                  >
                    <Icon className={`size-4 shrink-0 ${l.completed ? "text-academy" : "text-muted-foreground"}`} />
                    <span className="truncate">#{l.order_no} {l.title}</span>
                  </Link>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {l.duration_min ? `${l.duration_min} min` : l.lesson_type}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
        <aside>
          <h2 className="font-display text-lg font-medium text-ink mb-3">Faculty</h2>
          {faculty.length === 0 && <p className="text-sm text-muted-foreground">Not assigned yet.</p>}
          <div className="space-y-2">
            {faculty.map((f: any) => <FacultyCard key={f.id} profile={f} />)}
          </div>
        </aside>
      </div>
    </div>
  );
}
