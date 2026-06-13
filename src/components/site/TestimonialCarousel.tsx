import { Quote } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export type Testimonial = {
  quote: string;
  name: string;
  role: string;
  org: string;
};

export function TestimonialCarousel({ items }: { items: Testimonial[] }) {
  return (
    <Carousel opts={{ align: "start", loop: items.length > 2 }} className="w-full">
      <CarouselContent className="-ml-4">
        {items.map((t, i) => (
          <CarouselItem key={i} className="pl-4 md:basis-1/2 lg:basis-1/2">
            <figure className="flex h-full flex-col rounded-2xl bg-card p-7 ring-1 ring-border [box-shadow:var(--shadow-card)]">
              <Quote className="size-6 text-tech" aria-hidden />
              <blockquote className="mt-5 text-base md:text-lg leading-relaxed text-ink text-pretty">
                "{t.quote}"
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3 border-t border-border pt-5">
                <div className="grid size-10 place-items-center rounded-full bg-tech/10 font-display text-sm font-medium text-tech">
                  {t.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")}
                </div>
                <div className="text-sm">
                  <div className="font-medium text-ink">{t.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {t.role}, {t.org}
                  </div>
                </div>
              </figcaption>
            </figure>
          </CarouselItem>
        ))}
      </CarouselContent>
      <div className="mt-6 flex items-center justify-end gap-2">
        <CarouselPrevious className="static translate-y-0" />
        <CarouselNext className="static translate-y-0" />
      </div>
    </Carousel>
  );
}
