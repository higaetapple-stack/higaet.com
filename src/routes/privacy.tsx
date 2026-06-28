import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { PageHero } from "@/components/site/PageHero";
import { Section } from "@/components/site/Section";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — HIGAET" },
      { name: "description", content: "How HIGAET collects, uses, and protects your information." },
      { property: "og:url", content: "https://higaet.com/privacy" },
    ],
    links: [{ rel: "canonical", href: "https://higaet.com/privacy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <SiteShell>
      <PageHero eyebrow="Legal" title="Privacy Policy" subtitle="Last updated June 12, 2026" />
      <Section className="!pt-0">
        <div className="prose max-w-3xl space-y-6 text-muted-foreground leading-relaxed">
          <p>
            HIGAET respects your privacy. This policy describes what information we collect, how
            we use it, and the choices you have. This document is a Phase-1 placeholder while
            our legal team finalises the production policy — it should not be relied upon as
            legal advice.
          </p>
          <h2 className="font-display text-xl text-ink">Information we collect</h2>
          <p>
            We collect information you provide directly (enquiries, applications, account
            registration) and technical information about your visit (analytics, error reports).
          </p>
          <h2 className="font-display text-xl text-ink">How we use information</h2>
          <p>
            To respond to your enquiry, deliver services you've requested, improve the website,
            and (with your consent) for marketing communications.
          </p>
          <h2 className="font-display text-xl text-ink">Cookies & analytics</h2>
          <p>
            We use Google Analytics, Google Tag Manager, and Meta Pixel only after you grant
            consent via the cookie banner. You can change your choice at any time by clearing
            site data.
          </p>
          <h2 className="font-display text-xl text-ink">Contact</h2>
          <p>
            Questions or requests? Email{" "}
            <a href="mailto:privacy@higaet.com" className="text-ink underline">
              privacy@higaet.com
            </a>
            .
          </p>
        </div>
      </Section>
    </SiteShell>
  );
}
