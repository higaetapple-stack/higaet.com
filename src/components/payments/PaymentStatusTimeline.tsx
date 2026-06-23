import { Check, Clock, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = "pending_verification" | "info_requested" | "approved" | "rejected";

const STEPS: { key: Status; label: string }[] = [
  { key: "pending_verification", label: "Submitted" },
  { key: "info_requested", label: "Under review" },
  { key: "approved", label: "Approved" },
];

export function PaymentStatusTimeline({ status }: { status: string }) {
  const isRejected = status === "rejected";
  const currentIdx =
    status === "approved" ? 2 : status === "info_requested" ? 1 : 0;

  if (isRejected) {
    return (
      <div className="flex items-center gap-2 text-sm text-destructive" data-testid="payment-timeline-rejected">
        <X className="size-4" /> Rejected
      </div>
    );
  }

  return (
    <ol className="flex items-center gap-2 text-xs" data-testid="payment-timeline">
      {STEPS.map((step, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        const Icon = done ? Check : active && step.key === "info_requested" ? AlertCircle : Clock;
        return (
          <li key={step.key} className="flex items-center gap-2">
            <span
              className={cn(
                "flex items-center gap-1 rounded-full px-2 py-1 border",
                done && "bg-success/15 text-success border-success/30",
                active && step.key !== "info_requested" && "bg-primary/15 text-primary border-primary/30",
                active && step.key === "info_requested" && "bg-warning/15 text-warning border-warning/30",
                !done && !active && "bg-muted text-muted-foreground border-border",
              )}
            >
              <Icon className="size-3" />
              {step.label}
            </span>
            {i < STEPS.length - 1 && <span className="h-px w-3 bg-border" aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}
