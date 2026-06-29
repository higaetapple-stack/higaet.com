import { getHubLongform } from "@/lib/seo/hub-longform";
import { RelatedCluster } from "./RelatedCluster";
import { HubAuthorityBlock } from "@/components/seo/HubAuthorityBlock";
import type { ClusterId } from "@/lib/seo/topic-clusters";

interface HubLongformProps {
  clusterId: ClusterId;
  /** When true, also renders <RelatedCluster /> for the hub path. Default true. */
  withRelated?: boolean;
  className?: string;
}

/**
 * Authority-grade long-form block for a HIGAET cluster hub.
 *
 * Renders: overview · audience · use cases · workflow · adaptations ·
 * HIGAET tooling · FAQ — plus FAQPage JSON-LD for AEO/AI search.
 * Silently renders nothing if the cluster has no long-form entry.
 */
export function HubLongform({ clusterId, withRelated = true, className }: HubLongformProps) {
  const data = getHubLongform(clusterId);
  if (!data) return null;

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: data.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <section
      aria-label={data.heading}
      className={className ?? "mx-auto w-full max-w-6xl px-4 py-16 md:py-20"}
    >
      {/* P5.2 — Authority block (definition, comparison, workflow, entities, reinforcement) */}
      <HubAuthorityBlock clusterId={clusterId} className="mb-12 px-0 py-0" />
      <header className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Topic cluster · {data.clusterId}
        </p>
        <h2 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight">
          {data.heading}
        </h2>
        <p className="mt-4 text-base md:text-lg text-muted-foreground leading-relaxed">
          {data.overview}
        </p>
      </header>

      {/* Audience */}
      <div className="mt-12">
        <h3 className="text-xl font-semibold">Who this is for</h3>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 list-disc list-inside text-sm text-muted-foreground">
          {data.audience.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      </div>

      {/* Use cases */}
      <div className="mt-12">
        <h3 className="text-xl font-semibold">Use cases</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.useCases.map((u) => (
            <div key={u.title} className="rounded-xl border border-border bg-card/40 p-4">
              <p className="font-medium">{u.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{u.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Workflow */}
      <div className="mt-12">
        <h3 className="text-xl font-semibold">How it works</h3>
        <ol className="mt-4 space-y-3">
          {data.workflow.map((s) => (
            <li key={s.step} className="rounded-lg border border-border/60 p-4">
              <p className="font-medium">{s.step}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>

      {/* Adaptations */}
      <div className="mt-12">
        <h3 className="text-xl font-semibold">Adaptations</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {data.adaptations.map((p) => (
            <div key={p.persona} className="rounded-lg border border-border/60 p-4">
              <p className="font-medium">{p.persona}</p>
              <p className="mt-1 text-sm text-muted-foreground">{p.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* HIGAET tooling */}
      <div className="mt-12">
        <h3 className="text-xl font-semibold">HIGAET tools you'll use</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {data.tools.map((t) => (
            <div key={t.feature} className="rounded-lg border border-border/60 p-4">
              <p className="font-medium">{t.feature}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-12">
        <h3 className="text-xl font-semibold">Frequently asked questions</h3>
        <dl className="mt-4 divide-y divide-border rounded-xl border border-border">
          {data.faqs.map((f) => (
            <div key={f.q} className="p-4">
              <dt className="font-medium">{f.q}</dt>
              <dd className="mt-1 text-sm text-muted-foreground">{f.a}</dd>
            </div>
          ))}
        </dl>
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      </div>

      {withRelated && (
        <div className="mt-12">
          <RelatedCluster path={data.path} />
        </div>
      )}
    </section>
  );
}

export default HubLongform;
