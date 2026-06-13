import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { PageHero } from "@/components/site/PageHero";
import { Section } from "@/components/site/Section";

const PATH = "/cookies";

export const Route = createFileRoute("/cookies")({
  head: () => ({
    meta: [
      { title: "Cookie Policy | HIGAET" },
      {
        name: "description",
        content:
          "How HIGAET uses cookies and similar technologies across its Academy, Global Education Hub, and Technologies websites.",
      },
      { property: "og:title", content: "Cookie Policy | HIGAET" },
      {
        property: "og:description",
        content: "How HIGAET uses cookies across its websites and how you can manage them.",
      },
      { property: "og:url", content: PATH },
    ],
    links: [{ rel: "canonical", href: PATH }],
  }),
  component: CookiesPage,
});

function CookiesPage() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="Legal"
        title="Cookie Policy"
        subtitle="What cookies we use, why we use them, and how you can change your mind."
      />
      <Section className="!pt-0">
        <div className="prose prose-neutral max-w-3xl text-muted-foreground leading-relaxed">
          <h2 className="font-display text-2xl text-ink mt-0">Overview</h2>
          <p>
            HIGAET operates three public-facing websites — HIGAET Academy, HIGAET Global Education
            Hub, and HIGAET Technologies. This policy explains how cookies and similar
            technologies are used across those properties.
          </p>

          <h2 className="font-display text-2xl text-ink">Categories of cookies</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong className="text-ink">Strictly necessary.</strong> Required for the site to
              function — for example, authentication, security, and remembering your cookie
              preferences. These cannot be disabled.
            </li>
            <li>
              <strong className="text-ink">Analytics.</strong> Aggregated, privacy-respecting
              measurement of how the site is used so we can improve it. We do not sell this data.
            </li>
            <li>
              <strong className="text-ink">Functional.</strong> Remembering preferences such as
              language and division (Academy, Global, Technologies).
            </li>
            <li>
              <strong className="text-ink">Marketing.</strong> Only set after you opt in. Used to
              measure the effectiveness of HIGAET campaigns. None of our pages set marketing
              cookies before consent.
            </li>
          </ul>

          <h2 className="font-display text-2xl text-ink">Managing your preferences</h2>
          <p>
            You can change your cookie preferences any time using the cookie banner. You can also
            block or delete cookies directly in your browser. Doing so may affect parts of the
            HIGAET sites that depend on functional or analytics cookies.
          </p>

          <h2 className="font-display text-2xl text-ink">Third parties</h2>
          <p>
            We use a small number of established analytics and product providers. We will list each
            specific provider here as we wire them in, including the cookie name, purpose, and
            retention period.
          </p>

          <h2 className="font-display text-2xl text-ink">Contact</h2>
          <p>
            Questions about this policy can be sent through the HIGAET Technologies{" "}
            <a className="text-tech underline" href="/technologies/contact">contact page</a>.
          </p>

          <p className="text-xs text-muted-foreground mt-10">
            This page is updated as our cookie usage changes. Last reviewed: 2026.
          </p>
        </div>
      </Section>
    </SiteShell>
  );
}
