import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyPrograms } from "@/lib/learn.functions";
import { ProgramCard } from "@/components/lms/ProgramCard";
import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/programs")({
  component: MyPrograms,
});

function MyPrograms() {
  const fetchPrograms = useServerFn(getMyPrograms);
  const { data, isLoading } = useQuery({
    queryKey: ["my-programs"],
    queryFn: () => fetchPrograms(),
  });

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-medium text-ink">My programs</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Continue where you left off. Progress and certificates update automatically as you complete lessons.
        </p>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {!isLoading && (data?.length ?? 0) === 0 && (
        <div className="rounded-2xl bg-card ring-1 ring-border p-10 text-center">
          <div className="mx-auto size-12 rounded-full bg-academy/10 text-academy grid place-items-center">
            <GraduationCap className="size-5" />
          </div>
          <h2 className="font-display text-lg font-medium text-ink mt-5">You're not enrolled yet</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            Explore HIGAET Academy programs and apply, or ask an admin to enroll you in a cohort.
          </p>
          <Button asChild className="mt-5 bg-academy text-academy-foreground hover:bg-academy/90">
            <Link to="/academy/programs">Browse programs</Link>
          </Button>
        </div>
      )}

      {data && data.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {data.map((row: any) => (
            <ProgramCard key={row.enrollment_id} program={row.program} progress={row.progress} />
          ))}
        </div>
      )}
    </div>
  );
}
