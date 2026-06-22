import { createFileRoute } from "@tanstack/react-router";
import { PeoplePage } from "@/components/site/PeoplePage";
import { FOUNDER, profilePageJsonLd } from "@/content/people";

const PATH = "/founder";
const URL = `https://higaet.com${PATH}`;
const TITLE = "Founder — HIGAET";
const DESC = "Meet the founder of HIGAET (Helen Institute of Gen AI Engineering & Technology).";

export const Route = createFileRoute("/founder")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:url", content: URL },
      { property: "og:type", content: "profile" },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify(profilePageJsonLd({
        path: PATH,
        name: TITLE,
        description: DESC,
        people: [FOUNDER],
        breadcrumbs: [
          { name: "Home", url: "/" },
          { name: "About HIGAET", url: "/about-higaet" },
          { name: "Founder", url: PATH },
        ],
      })),
    }],
  }),
  component: () => (
    <PeoplePage
      eyebrow="Founder"
      title="The founder of HIGAET."
      subtitle="Leading the institute's mission across AI education, global mobility, and enterprise engineering."
      intro="HIGAET is led by its founder across three divisions — HIGAET Academy, HIGAET Global Education Hub, and HIGAET Technologies — and the HIGAET AI Platform."
      people={[FOUNDER]}
    />
  ),
});
