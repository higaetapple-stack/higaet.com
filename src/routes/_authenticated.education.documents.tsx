import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FileText, ExternalLink } from "lucide-react";
import { listMyAllDocuments } from "@/lib/education-hub.functions";

export const Route = createFileRoute("/_authenticated/education/documents")({
  component: DocumentsPage,
});

const DOC_LABEL: Record<string, string> = {
  passport: "Passport",
  transcript: "Transcript",
  resume: "Résumé",
  sop: "Statement of Purpose",
  lor: "Letter of Recommendation",
  english_test: "English Test",
  financial: "Financial",
  other: "Other",
};

function DocumentsPage() {
  const fetcher = useServerFn(listMyAllDocuments);
  const q = useQuery({ queryKey: ["edu-all-docs"], queryFn: () => fetcher() });
  const docs = q.data ?? [];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl text-ink">Documents</h2>
        <p className="text-sm text-muted-foreground mt-1">
          All files you've uploaded across your applications. Add new documents from any application page.
        </p>
      </div>

      {q.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : docs.length === 0 ? (
        <div className="rounded-2xl ring-1 ring-border bg-card p-8 text-center text-sm text-muted-foreground">
          No documents yet. Open an application to upload transcripts, SOPs and more.
        </div>
      ) : (
        <ul className="divide-y divide-border ring-1 ring-border rounded-2xl bg-card">
          {docs.map((d: any) => (
            <li key={d.id} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="size-5 text-global shrink-0" />
                <div className="min-w-0">
                  <div className="text-ink text-sm font-medium truncate">
                    {d.file_name || DOC_LABEL[d.doc_type] || d.doc_type}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {DOC_LABEL[d.doc_type] ?? d.doc_type} · v{d.version} · {d.applications?.universities?.name ?? "Application"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {d.application_id && (
                  <Link
                    to="/dashboard/applications/$id"
                    params={{ id: d.application_id }}
                    className="text-xs text-muted-foreground hover:text-ink"
                  >
                    Open
                  </Link>
                )}
                {d.file_url && (
                  <a
                    href={d.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-global inline-flex items-center gap-1"
                  >
                    View <ExternalLink className="size-3" />
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
