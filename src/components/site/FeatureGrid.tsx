import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";

export type Feature = {
  icon: ComponentType<LucideProps>;
  title: string;
  body: string;
};

export function FeatureGrid({
  features,
  columns = 3,
  brand,
}: {
  features: Feature[];
  columns?: 2 | 3 | 4;
  brand?: "academy" | "global" | "tech";
}) {
  const colsClass = columns === 4 ? "md:grid-cols-4" : columns === 2 ? "md:grid-cols-2" : "md:grid-cols-3";
  const accent =
    brand === "academy"
      ? "text-academy bg-academy/10"
      : brand === "global"
        ? "text-global bg-global/10"
        : brand === "tech"
          ? "text-tech bg-tech/10"
          : "text-ink bg-muted";
  return (
    <div className={cn("grid grid-cols-1 gap-6", colsClass)}>
      {features.map((f) => {
        const Icon = f.icon;
        return (
          <article
            key={f.title}
            className="p-6 rounded-xl ring-1 ring-border bg-card hover:ring-foreground/20 transition"
          >
            <div className={cn("size-10 rounded-lg flex items-center justify-center mb-5", accent)}>
              <Icon className="size-5" aria-hidden />
            </div>
            <h3 className="font-display text-lg font-medium mb-2 text-ink">{f.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{f.body}</p>
          </article>
        );
      })}
    </div>
  );
}
