import { Badge } from "@/components/ui/badge";

const TONE: Record<string, string> = {
  submitted: "bg-muted text-ink",
  under_review: "bg-blue-100 text-blue-700",
  shortlisted: "bg-amber-100 text-amber-800",
  rejected: "bg-destructive/10 text-destructive",
  withdrawn: "bg-muted text-muted-foreground",
  hired: "bg-academy/10 text-academy",
};

export function ApplicationStatusBadge({ status }: { status: string }) {
  return <Badge className={TONE[status] ?? "bg-muted text-ink"}>{status.replace(/_/g, " ")}</Badge>;
}
