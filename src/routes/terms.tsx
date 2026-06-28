import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { PageHero } from "@/components/site/PageHero";
import { Section } from "@/components/site/Section";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — HIGAET" },
      { name: "description", content: "Terms governing your use of HIGAET websites and services." },
      { property: "og:url", content: "https://higaet.com/terms" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <SiteShell>
      <PageHero eyebrow="Legal" title="Terms of Service" subtitle="Last updated June 12, 2026" />
      <Section className="!pt-0">
        <div className="prose max-w-3xl space-y-6 text-muted-foreground leading-relaxed">
          <p>
            By accessing or using HIGAET websites and services, you agree to these terms. This is
            a Phase-1 placeholder; final terms will be issued by our legal team prior to public
            launch.
          </p>
          <h2 className="font-display text-xl text-ink">Use of the site</h2>
          <p>
            You agree to use the site only for lawful purposes and not in a way that infringes
            the rights of, restricts, or inhibits anyone else's use of the site.
          </p>
          <h2 className="font-display text-xl text-ink">Intellectual property</h2>
          <p>All content on this site is owned by HIGAET or its licensors and is protected by applicable law.</p>
          <h2 className="font-display text-xl text-ink">Contact</h2>
          <p>
            Questions about these terms? Email{" "}
            <a href="mailto:legal@higaet.com" className="text-ink underline">
              legal@higaet.com
            </a>
            .
          </p>
        </div>
      </Section>
    </SiteShell>
  );
}
