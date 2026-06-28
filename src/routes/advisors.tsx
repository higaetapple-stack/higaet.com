import { createFileRoute } from "@tanstack/react-router";
import { PeoplePage } from "@/components/site/PeoplePage";
import { ADVISORS, profilePageJsonLd } from "@/content/people";

const PATH = "/advisors";
const URL = `https://higaet.com${PATH}`;
const TITLE = "Advisors — HIGAET";
const DESC = "HIGAET's academic, industry, and global education advisors.";

export const Route = createFileRoute("/advisors")({
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
        people: ADVISORS,
        breadcrumbs: [
          { name: "Home", url: "/" },
          { name: "About HIGAET", url: "/about-higaet" },
          { name: "Advisors", url: PATH },
        ],
      })),
    }],
  }),
  component: () => (
    <PeoplePage
      eyebrow="Advisors"
      title="The HIGAET advisory network."
      subtitle="Academic, industry, and global education advisors who guide HIGAET's direction."
      intro="HIGAET's advisors shape curriculum standards, enterprise relevance, and international education strategy across the institute."
      people={ADVISORS}
    />
  ),
});
