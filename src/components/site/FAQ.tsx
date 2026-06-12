import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export type QA = { q: string; a: string };

export function FAQ({ items, title, eyebrow }: { items: QA[]; title?: string; eyebrow?: string }) {
  return (
    <div>
      {eyebrow && (
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4 block">
          {eyebrow}
        </span>
      )}
      {title && <h2 className="font-display text-3xl md:text-4xl font-medium tracking-tight mb-8">{title}</h2>}
      <Accordion type="single" collapsible className="w-full">
        {items.map((item, idx) => (
          <AccordionItem key={idx} value={`item-${idx}`}>
            <AccordionTrigger className="text-left font-medium text-base">{item.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed">{item.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

/** Build a JSON-LD FAQPage block from the same QA list. */
export function faqJsonLd(items: QA[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: { "@type": "Answer", text: it.a },
    })),
  };
}
