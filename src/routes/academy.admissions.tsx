import { createFileRoute } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { CalendarClock, MessageCircle, Sparkles, Phone, Mail } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Section, Eyebrow } from "@/components/site/Section";
import { LeadForm } from "@/components/site/LeadForm";
import { PROGRAMS } from "@/lib/academy-programs";

const intentSchema = z.object({
  intent: fallback(z.enum(["apply", "counselling", "brochure"]), "apply").default("apply"),
  program: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/academy/admissions")({
  validateSearch: zodValidator(intentSchema),
  head: () => ({
    meta: [
      { title: "Admissions — HIGAET Academy" },
      { name: "description", content: "Apply to HIGAET Academy, book a counselling session, or download a program brochure. Structured admissions in 6 steps." },
      { property: "og:title", content: "Admissions — HIGAET Academy" },
      { property: "og:description", content: "Apply, talk to an advisor, or request a brochure." },
      { property: "og:url", content: "/academy/admissions" },
    ],
    links: [{ rel: "canonical", href: "/academy/admissions" }],
  }),
  component: AdmissionsPage,
});

const STEPS = [
  { n: "01", title: "Apply", body: "5-minute form. Background, goal, preferred program." },
  { n: "02", title: "Counselling", body: "20-minute conversation with a HIGAET advisor — fit, scholarships, timelines." },
  { n: "03", title: "Enrolment", body: "Confirm cohort, scholarship band, payment plan, and start date." },
  { n: "04", title: "Learning", body: "Live cohorts, recorded modules, hands-on labs, mentor reviews." },
  { n: "05", title: "Certification", body: "Industry-recognised HIGAET credential and verified outcomes record." },
  { n: "06", title: "Placement", body: "Dedicated placement counsellor, interview prep, employer introductions." },
];

const INTENT_COPY: Record<"apply" | "counselling" | "brochure", { eyebrow: string; title: string; body: string; icon: typeof Sparkles }> = {
  apply: {
    eyebrow: "Start your application",
    title: "Apply to HIGAET Academy.",
    body: "Tell us about your background and the program that interests you. An advisor will respond within one business day.",
    icon: Sparkles,
  },
  counselling: {
    eyebrow: "Book counselling",
    title: "Talk to a HIGAET advisor.",
    body: "A free 20-minute fit assessment. We'll help you choose the right program, payment plan, and start date.",
    icon: CalendarClock,
  },
  brochure: {
    eyebrow: "Download brochure",
    title: "Get the full program brochure.",
    body: "Share your details and we'll email the brochure for the program you're interested in.",
    icon: MessageCircle,
  },
};

function AdmissionsPage() {
  const { intent, program } = Route.useSearch();
  const copy = INTENT_COPY[intent as "apply" | "counselling" | "brochure"];
  const Icon = copy.icon;
  const selectedProgram = PROGRAMS.find((p) => p.slug === program);

  return (
    <>
      <PageHero
        brand="academy"
        eyebrow={copy.eyebrow}
        title={copy.title}
        subtitle={copy.body}
      />

      <Section className="!pt-0">
        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-12 items-start">
          <div className="rounded-2xl bg-card ring-1 ring-border p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="size-10 rounded-lg bg-academy/10 text-academy grid place-items-center">
                <Icon className="size-5" />
              </div>
              <div>
                <h2 className="font-display text-xl font-medium text-ink">
                  {selectedProgram ? `Enquiry: ${selectedProgram.title}` : "Tell us about you"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  An advisor responds within one business day.
                </p>
              </div>
            </div>
            <LeadForm
              division="academy"
              source={`admissions:${intent}${program ? `:${program}` : ""}`}
            />
            <p className="text-xs text-muted-foreground mt-6">
              By submitting you agree to be contacted by HIGAET about your enquiry. We never share your details with third parties.
            </p>
          </div>

          <div className="space-y-8">
            <div>
              <Eyebrow brand="academy">Other ways to reach us</Eyebrow>
              <ul className="mt-4 space-y-3 text-sm">
                <li className="flex items-center gap-3 text-ink">
                  <Phone className="size-4 text-academy" /> +91 80000 00000 (Mon–Sat, 10am–7pm IST)
                </li>
                <li className="flex items-center gap-3 text-ink">
                  <Mail className="size-4 text-academy" /> admissions@higaet.edu
                </li>
              </ul>
            </div>

            <div>
              <Eyebrow brand="academy">What happens next</Eyebrow>
              <ol className="mt-4 space-y-4">
                {STEPS.map((s) => (
                  <li key={s.n} className="flex gap-4">
                    <span className="text-academy font-display text-lg font-medium tabular-nums w-8 shrink-0">
                      {s.n}
                    </span>
                    <div>
                      <div className="font-medium text-ink text-sm">{s.title}</div>
                      <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{s.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
