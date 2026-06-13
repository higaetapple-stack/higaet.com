export function ProgressBar({ value, className = "" }: { value: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={`h-1.5 w-full rounded-full bg-muted overflow-hidden ${className}`}>
      <div
        className="h-full bg-academy transition-[width] duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
