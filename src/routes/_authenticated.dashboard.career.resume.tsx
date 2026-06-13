import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getMyResumeData } from "@/lib/career.functions";
import { Button } from "@/components/ui/button";
import { ResumeView } from "@/components/career/ResumeView";
import { Printer } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/career/resume")({
  component: ResumePage,
});

function ResumePage() {
  const fn = useServerFn(getMyResumeData);
  const q = useQuery({ queryKey: ["my-resume"], queryFn: () => fn() });
  const [tpl, setTpl] = useState<"classic" | "modern">("classic");

  if (q.isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!q.data) return <p className="text-sm text-muted-foreground">No resume data.</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 print:hidden">
        <div className="flex gap-1 rounded-md ring-1 ring-border p-0.5">
          {(["classic", "modern"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTpl(t)}
              className={`px-3 py-1 text-xs rounded ${tpl === t ? "bg-academy text-academy-foreground" : "text-muted-foreground"}`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <Button onClick={() => window.print()} className="bg-academy text-academy-foreground hover:bg-academy/90">
          <Printer className="size-4" /> Print / Save as PDF
        </Button>
      </div>
      <div className="ring-1 ring-border rounded-2xl overflow-hidden bg-muted/30 print:ring-0 print:bg-white">
        <ResumeView data={q.data as any} template={tpl} />
      </div>
      <style>{`@media print { @page { margin: 14mm } body { background: white !important } #resume-print { padding: 0 !important } .print\\:hidden { display: none !important } }`}</style>
    </div>
  );
}
