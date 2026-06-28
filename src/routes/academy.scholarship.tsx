import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ArrowRight, Calendar, FileText, Trophy } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Section, Eyebrow } from "@/components/site/Section";
import { CTASection } from "@/components/site/CTASection";
import { FAQ, faqJsonLd } from "@/components/site/FAQ";
import { LeadForm } from "@/components/site/LeadForm";

const FAQS = [
  { q: "Who can take the HAT?", a: "Any graduate or final-year undergraduate from a recognised institution. There is no minimum percentage requirement to attempt the test." },
  { q: "Is the HAT free?", a: "Yes. The HIGAET Aptitude Test is free for all eligible applicants." },
  { q: "How are scholarships decided?", a: "Awards are based on HAT percentile, written response quality, and a short fit interview. Need-based components are also available." },
  { q: "Can I retake the HAT?", a: "Yes — once per admissions cycle. Your higher score is used." },
  { q: "Does the scholarship apply to all programs?", a: "Yes, across all HIGAET Academy career tracks and campus programs." },
];

const TEST_SECTIONS = [
  { name: "Quantitative reasoning", count: 20, minutes: 30 },
  { name: "Logical & verbal reasoning", count: 25, minutes: 30 },
  { name: "Computational thinking", count: 15, minutes: 30 },
  { name: "Written response", count: 1, minutes: 30 },
];

const TIMELINE = [
  { date: "Open now", title: "Register for the HAT", body: "Free to attempt. Schedule slots run every week." },
  { date: "Within 5 days", title: "Take the test online", body: "120-minute proctored test on the HIGAET assessment platform." },
  { date: "Within 7 days of test", title: "Receive your scorecard", body: "Percentile, section breakdown, and scholarship band." },
  { date: "Within 14 days", title: "Fit interview & award", body: "30-minute conversation with an admissions advisor; award confirmed." },
];

export const Route = createFileRoute("/academy/scholarship")({
  head: () => ({
    meta: [
      { title: "HIGAET Aptitude Test (HAT) — Scholarships up to 100%" },
      { name: "description", content: "Take the free HIGAET Aptitude Test (HAT) for scholarships up to 100% across HIGAET Academy programs and campus diplomas." },
      { property: "og:title", content: "HIGAET Aptitude Test (HAT)" },
      { property: "og:description", content: "Free entrance test for HIGAET scholarships up to 100%." },
      { property: "og:url", content: "https://higaet.com/academy/scholarship" },
    ],
    scripts: [{ type: "application/ld+json", children: JSON.stringify(faqJsonLd(FAQS)) }],
  }),
  component: ScholarshipPage,
});

function ScholarshipPage() {
  return (
    <>
      <PageHero
        brand="academy"
        eyebrow="HIGAET Aptitude Test"
        title="Scholarships up to 100% — earned, not allocated."
        subtitle="The HAT is HIGAET's free entrance test. Strong performers earn scholarships of 20–100% across every Academy program and campus diploma."
      >
        <div className="flex flex-wrap gap-3">
          <Link
            to="/academy/contact"
            className="inline-flex items-center gap-1.5 bg-ink text-surface text-sm font-medium px-4 py-2.5 rounded-md hover:bg-ink/90 transition-colors"
          >
            Register for the HAT <ArrowRight className="size-4" aria-hidden />
          </Link>
          <Link
            to="/academy/programs"
            className="inline-flex items-center gap-1.5 ring-1 ring-border text-sm font-medium px-4 py-2.5 rounded-md text-ink hover:bg-muted transition-colors"
          >
            Browse eligible programs
          </Link>
        </div>
      </PageHero>

      {/* Scholarship bands */}
      <Section className="!pt-0">
        <Eyebrow brand="academy">Scholarship bands</Eyebrow>
        <h2 className="mt-4 max-w-[22ch] font-display text-3xl font-medium tracking-tight text-ink md:text-4xl">
          What your HAT percentile unlocks.
        </h2>
        <div className="mt-10 grid gap-4 md:grid-cols-4">
          {[
            { band: "100%", who: "Top 1% — Founder's Scholarship", color: "bg-academy text-surface" },
            { band: "75%", who: "Top 5% — Director's Scholarship", color: "bg-academy/20 text-academy" },
            { band: "50%", who: "Top 15% — Merit Scholarship", color: "bg-academy/10 text-academy" },
            { band: "20–35%", who: "Top 40% — Achiever's Award", color: "bg-muted text-ink" },
          ].map((b) => (
            <article key={b.band} className="rounded-xl bg-card p-6 ring-1 ring-border">
              <span className={`inline-block rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-widest ${b.color}`}>
                {b.band} off
              </span>
              <p className="mt-4 text-sm text-ink">{b.who}</p>
            </article>
          ))}
        </div>
      </Section>

      {/* Test pattern */}
      <Section className="bg-muted/30">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Eyebrow brand="academy">Test pattern</Eyebrow>
            <h2 className="mt-4 font-display text-3xl font-medium tracking-tight text-ink md:text-4xl">
              120 minutes, four sections.
            </h2>
            <p className="mt-5 text-muted-foreground leading-relaxed">
              The HAT measures the foundational skills that predict success in HIGAET programs — clear quantitative reasoning, structured thinking, and the ability to communicate.
            </p>
          </div>
          <div className="overflow-hidden rounded-2xl ring-1 ring-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="text-left p-4">Section</th>
                  <th className="text-right p-4">Questions</th>
                  <th className="text-right p-4">Minutes</th>
                </tr>
              </thead>
              <tbody>
                {TEST_SECTIONS.map((s) => (
                  <tr key={s.name} className="border-t border-border">
                    <td className="p-4 text-ink">{s.name}</td>
                    <td className="p-4 text-right text-ink">{s.count}</td>
                    <td className="p-4 text-right text-ink">{s.minutes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      {/* Timeline */}
      <Section>
        <Eyebrow brand="academy">How it works</Eyebrow>
        <h2 className="mt-4 max-w-[24ch] font-display text-3xl font-medium tracking-tight text-ink md:text-4xl">
          From registration to award in two weeks.
        </h2>
        <ol className="mt-10 grid gap-6 md:grid-cols-4">
          {TIMELINE.map((t, i) => (
            <li key={t.title} className="rounded-xl bg-card p-6 ring-1 ring-border">
              <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-academy/10 text-academy">
                {i === 0 ? <FileText className="size-5" /> : i === 1 ? <Calendar className="size-5" /> : i === 2 ? <CheckCircle2 className="size-5" /> : <Trophy className="size-5" />}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-academy">{t.date}</span>
              <h3 className="mt-2 font-display text-base font-medium text-ink">{t.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* Register form */}
      <Section className="bg-muted/30">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Eyebrow brand="academy">Register</Eyebrow>
            <h2 className="mt-4 font-display text-3xl font-medium tracking-tight text-ink md:text-4xl">
              Reserve your HAT slot.
            </h2>
            <p className="mt-5 text-muted-foreground leading-relaxed">
              Share your contact details and the program you're considering. We'll send your HAT scheduling link within one business day.
            </p>
          </div>
          <div className="rounded-2xl bg-card p-6 ring-1 ring-border md:p-8">
            <LeadForm division="academy" source="scholarship:hat" />
          </div>
        </div>
      </Section>

      <Section>
        <FAQ items={FAQS} eyebrow="FAQ" title="Scholarship questions" />
      </Section>

      <CTASection
        title="A scholarship is the start, not the finish."
        body="Every awarded HIGAET student joins a cohort of peers selected on merit and ambition. The work begins the day you accept."
        primaryHref="/academy/contact"
        primaryLabel="Speak with admissions"
        secondaryHref="/academy/programs"
        secondaryLabel="See all programs"
      />
    </>
  );
}
