import { createFileRoute } from "@tanstack/react-router";
import { PeoplePage } from "@/components/site/PeoplePage";
import { LEADERSHIP, profilePageJsonLd } from "@/content/people";

const PATH = "/leadership";
const URL = `https://www.higaet.com${PATH}`;
const TITLE = "Leadership — HIGAET";
const DESC = "HIGAET's leadership across Academy, Global Education Hub, Technologies, and the AI Platform.";

export const Route = createFileRoute("/leadership")({
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
        people: LEADERSHIP,
        breadcrumbs: [
          { name: "Home", url: "/" },
          { name: "About HIGAET", url: "/about-higaet" },
          { name: "Leadership", url: PATH },
        ],
      })),
    }],
  }),
  component: () => (
    <PeoplePage
      eyebrow="Leadership"
      title="The HIGAET leadership team."
      subtitle="Owners of strategy, curriculum, global education, technology, and the AI Platform."
      intro="HIGAET's leadership team operates the institute's three divisions and the AI Platform as a single, coordinated organization."
      people={LEADERSHIP}
    />
  ),
});
