import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getProgramDetail } from "@/lib/learn.functions";
import { ProgressBar } from "@/components/lms/ProgressBar";
import { FacultyCard } from "@/components/lms/FacultyCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle2, Circle, PlayCircle, Award, Lock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/programs/$slug")({
  component: ProgramDetail,
});

function ProgramDetail() {
  const { slug } = Route.useParams();
  const fetchDetail = useServerFn(getProgramDetail);
  const { data, isLoading, error } = useQuery({
    queryKey: ["program-detail", slug],
    queryFn: () => fetchDetail({ data: { slug } }),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (error || !data) {
    return (
      <div className="text-sm text-muted-foreground">
        Program not found.{" "}
        <Link to="/dashboard/programs" className="text-academy underline">My programs</Link>
      </div>
    );
  }

  const { program, enrollment, curriculum, progress, certificate_eligible, next_lesson_id } = data;
  const enrolled = !!enrollment;
  const allFaculty = Array.from(
    new Map(curriculum.flatMap((c: any) => c.faculty).map((f: any) => [f.id, f])).values(),
  );

  return (
    <div className="max-w-5xl">
      <Button asChild variant="ghost" size="sm" className="mb-3">
        <Link to="/dashboard/programs"><ArrowLeft className="size-4" /> My programs</Link>
      </Button>

      <div className="rounded-2xl bg-card ring-1 ring-border p-6 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {program.category.replace(/_/g, " ")}
            </div>
            <h1 className="font-display text-2xl font-medium text-ink mt-1">{program.title}</h1>
            {program.description && (
              <p className="text-sm text-muted-foreground mt-2 max-w-2xl">{program.description}</p>
            )}
          </div>
          <div className="text-right shrink-0">
            <Badge variant={enrolled ? "default" : "secondary"}>
              {enrolled ? "Enrolled" : "Not enrolled"}
            </Badge>
            {certificate_eligible && (
              <Badge className="ml-2 bg-academy/10 text-academy hover:bg-academy/15">
                <Award className="size-3" /> Certificate ready
              </Badge>
            )}
          </div>
        </div>
        <div className="mt-5">
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>{progress.pct}% complete</span>
            <span>{progress.done} / {progress.total} lessons</span>
          </div>
          <ProgressBar value={progress.pct} />
        </div>
        {enrolled && next_lesson_id && (
          <div className="mt-5">
            <Button asChild className="bg-academy text-academy-foreground hover:bg-academy/90">
              <Link to="/dashboard/lessons/$lessonId" params={{ lessonId: next_lesson_id }}>
                <PlayCircle className="size-4" /> Continue learning
              </Link>
            </Button>
          </div>
        )}
        {!enrolled && (
          <div className="mt-5 text-sm text-muted-foreground">
            You're not enrolled. Ask an admin or counsellor to enroll you to access lesson content.
          </div>
        )}
      </div>

      <Tabs defaultValue="curriculum">
        <TabsList>
          <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
          <TabsTrigger value="faculty">Faculty</TabsTrigger>
          <TabsTrigger value="certificate">Certificate</TabsTrigger>
        </TabsList>

        <TabsContent value="curriculum" className="mt-4 space-y-3">
          {curriculum.length === 0 && (
            <p className="text-sm text-muted-foreground">No courses published yet.</p>
          )}
          {curriculum.map((c: any) => (
            <div key={c.id} className="rounded-xl bg-card ring-1 ring-border p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">Course #{c.order_no}</div>
                  <h3 className="font-medium text-ink">
                    <Link to="/dashboard/courses/$courseId" params={{ courseId: c.id }} className="hover:text-academy">
                      {c.title}
                    </Link>
                  </h3>
                </div>
                <Badge variant="secondary">{c.lessons.length} lessons</Badge>
              </div>
              <ul className="mt-3 divide-y divide-border border-t border-border">
                {c.lessons.map((l: any) => {
                  const canOpen = enrolled || l.preview;
                  const Icon = l.completed ? CheckCircle2 : canOpen ? Circle : Lock;
                  return (
                    <li key={l.id} className="flex items-center justify-between py-2 text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon className={`size-4 shrink-0 ${l.completed ? "text-academy" : "text-muted-foreground"}`} />
                        {canOpen ? (
                          <Link
                            to="/dashboard/lessons/$lessonId"
                            params={{ lessonId: l.id }}
                            className="text-ink hover:text-academy truncate"
                          >
                            {l.title}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground truncate">{l.title}</span>
                        )}
                        {l.preview && !enrolled && <Badge variant="secondary">Preview</Badge>}
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {l.duration_min ? `${l.duration_min} min` : l.lesson_type}
                      </span>
                    </li>
                  );
                })}
                {c.lessons.length === 0 && <li className="py-2 text-xs text-muted-foreground">No lessons yet.</li>}
              </ul>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="faculty" className="mt-4">
          {allFaculty.length === 0 && <p className="text-sm text-muted-foreground">Faculty not assigned yet.</p>}
          <div className="grid sm:grid-cols-2 gap-3">
            {allFaculty.map((f: any) => <FacultyCard key={f.id} profile={f} />)}
          </div>
        </TabsContent>

        <TabsContent value="certificate" className="mt-4">
          <div className="rounded-xl bg-card ring-1 ring-border p-6 text-center">
            <div className="mx-auto size-12 rounded-full bg-academy/10 text-academy grid place-items-center">
              <Award className="size-5" />
            </div>
            <h3 className="font-display text-lg font-medium text-ink mt-3">
              {certificate_eligible ? "You're eligible!" : `${progress.pct}% toward your certificate`}
            </h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              {certificate_eligible
                ? "Certificate generation and download arrive in Sprint 2C."
                : "Complete every lesson in this program to unlock your HIGAET certificate."}
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
