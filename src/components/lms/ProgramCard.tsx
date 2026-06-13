import { Link } from "@tanstack/react-router";
import { ArrowRight, GraduationCap } from "lucide-react";
import { ProgressBar } from "./ProgressBar";
import { Button } from "@/components/ui/button";

export function ProgramCard({
  program,
  progress,
}: {
  program: { slug: string; title: string; category: string; thumbnail_url: string | null };
  progress: { done: number; total: number; pct: number };
}) {
  return (
    <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden flex flex-col">
      <div className="aspect-[16/9] bg-muted overflow-hidden relative">
        {program.thumbnail_url ? (
          <img src={program.thumbnail_url} alt={program.title} className="size-full object-cover" />
        ) : (
          <div className="size-full grid place-items-center text-academy/40">
            <GraduationCap className="size-12" />
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {program.category.replace(/_/g, " ")}
          </div>
          <h3 className="font-display text-base font-medium text-ink mt-1 line-clamp-2">{program.title}</h3>
        </div>
        <div className="mt-auto space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{progress.pct}% complete</span>
            <span>{progress.done} / {progress.total} lessons</span>
          </div>
          <ProgressBar value={progress.pct} />
          <Button
            asChild
            size="sm"
            className="w-full bg-academy text-academy-foreground hover:bg-academy/90"
          >
            <Link to="/dashboard/programs/$slug" params={{ slug: program.slug }}>
              Continue learning <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
