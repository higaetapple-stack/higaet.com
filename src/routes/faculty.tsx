import { createFileRoute } from "@tanstack/react-router";
import { PeoplePage } from "@/components/site/PeoplePage";
import { FACULTY, profilePageJsonLd } from "@/content/people";

const PATH = "/faculty";
const URL = `https://higaet.com${PATH}`;
const TITLE = "Faculty — HIGAET Academy";
const DESC = "Lead faculty across Generative AI, RAG, Agentic AI, and Data Science programs at HIGAET Academy.";

export const Route = createFileRoute("/faculty")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:url", content: URL },
      { property: "og:type", content: "profile" },
    ],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify(profilePageJsonLd({
        path: PATH,
        name: TITLE,
        description: DESC,
        people: FACULTY,
        breadcrumbs: [
          { name: "Home", url: "/" },
          { name: "HIGAET Academy", url: "/higaet-academy" },
          { name: "Faculty", url: PATH },
        ],
      })),
    }],
  }),
  component: () => (
    <PeoplePage
      eyebrow="Faculty"
      title="Practitioners who teach the curriculum."
      subtitle="Lead faculty across HIGAET Academy's Generative AI, RAG, Agentic AI, and Data Science programs."
      intro="HIGAET Academy faculty combine industry practice with structured teaching to deliver job-ready AI engineering education."
      people={FACULTY}
    />
  ),
});
