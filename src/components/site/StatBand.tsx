import { Container } from "./Container";

export type Stat = { value: string; label: string };

export function StatBand({ stats }: { stats: Stat[] }) {
  return (
    <section className="py-12 border-y border-border/60 bg-muted/40" aria-label="Key statistics">
      <Container>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 items-center">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-3xl md:text-4xl font-display font-medium text-ink">{s.value}</div>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-1.5">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
