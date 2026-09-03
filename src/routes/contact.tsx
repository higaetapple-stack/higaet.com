import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { PageHero } from "@/components/site/PageHero";
import { Section } from "@/components/site/Section";
import { LeadForm } from "@/components/site/LeadForm";
import { Mail, MapPin, Phone } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact HIGAET — Talk to an advisor" },
      {
        name: "description",
        content:
          "Get in touch with HIGAET — Academy admissions, Global Education Hub counselling, or Technologies enterprise enquiries.",
      },
      { property: "og:title", content: "Contact HIGAET" },
      { property: "og:description", content: "Get in touch with the HIGAET team." },
      { property: "og:url", content: "https://www.higaet.com/contact" },
    ],
  }),
  component: ContactPage,
});

const DIVISION_EMAILS = [
  {
    title: "Academy admissions",
    body: "Programs, batches, fees, certifications, and placement support.",
    email: "admissions@higaet.com",
  },
  {
    title: "Academy students",
    body: "Enrolled learner support, billing, and subscriptions.",
    email: "academy@higaet.com",
  },
  {
    title: "Global Education Hub",
    body: "Study abroad counselling, visas, scholarships, and university partnerships.",
    email: "admissions@higaet.com",
  },
  {
    title: "Technologies",
    body: "Enterprise projects and technology partnerships.",
    email: "partnerships@higaet.com",
  },
  {
    title: "Careers",
    body: "Open roles, referrals, and general applications.",
    email: "careers@higaet.com",
  },
  {
    title: "Support",
    body: "Help with accounts, access, and platform issues.",
    email: "support@higaet.com",
  },
] as const;

function ContactPage() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="Contact"
        title="Talk to a HIGAET advisor."
        subtitle="Tell us a bit about what you're after. An advisor from the right division will respond within one business day."
      />

      <Section className="!pt-0">
        <div className="grid lg:grid-cols-[1fr_360px] gap-12 max-w-6xl">
          <div className="rounded-2xl bg-card ring-1 ring-border p-6 md:p-8">
            <LeadForm source="contact_page" />
          </div>

          <aside className="space-y-8">
            <ContactBlock
              icon={<Mail className="size-4" />}
              title="Email"
              value="hello@higaet.com"
              href="mailto:hello@higaet.com"
            />
            <div className="space-y-3">
              <ContactBlock
                icon={<Phone className="size-4" />}
                title="Phone"
                value="+91 7780686821 (Mon–Sat, 10am–7pm IST)"
                href="tel:+917780686821"
              />
              <ContactBlock
                icon={<Phone className="size-4" />}
                title="Phone"
                value="+91 9491927094 (Mon–Sat, 10am–7pm IST)"
                href="tel:+919491927094"
              />
            </div>
            <ContactBlock
              icon={<MapPin className="size-4" />}
              title="Headquarters"
              value="HIGAET Campus, Bengaluru, India"
            />

            <div className="rounded-2xl bg-muted/50 p-6">
              <h3 className="font-display text-base font-medium text-ink mb-2">
                Press & partnerships
              </h3>
              <p className="text-sm text-muted-foreground">
                For media or partnership enquiries, write to{" "}
                <a href="mailto:partnerships@higaet.com" className="underline text-ink">
                  partnerships@higaet.com
                </a>
                .
              </p>
            </div>
          </aside>
        </div>
      </Section>

      <Section>
        <div className="max-w-6xl">
          <h2 className="font-display text-2xl font-medium text-ink">Reach the right team</h2>
          <ul className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {DIVISION_EMAILS.map((d) => (
              <li key={d.title + d.email} className="rounded-2xl bg-card p-6 ring-1 ring-border">
                <h3 className="font-display text-base font-medium text-ink">{d.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{d.body}</p>
                <a
                  href={"mailto:" + d.email}
                  className="mt-3 inline-block text-sm font-medium text-ink underline"
                >
                  {d.email}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </Section>
    </SiteShell>
  );
}

function ContactBlock({
  icon,
  title,
  value,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  href?: string;
}) {
  const Content = (
    <div className="flex items-start gap-4">
      <div className="shrink-0 size-9 rounded-md bg-muted flex items-center justify-center text-ink">
        {icon}
      </div>
      <div>
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
          {title}
        </div>
        <div className="text-sm text-ink">{value}</div>
      </div>
    </div>
  );
  return href ? (
    <a href={href} className="block hover:opacity-80 transition-opacity">
      {Content}
    </a>
  ) : (
    Content
  );
}
