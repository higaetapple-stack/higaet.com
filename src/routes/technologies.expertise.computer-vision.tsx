import { createFileRoute } from "@tanstack/react-router";
import { TechnologyDetailPage, buildTechnologyHead } from "@/components/site/TechnologyDetailPage";
import { ALL_TECHNOLOGIES, TECH_LOOKUP } from "@/content/technologies.index";

const C = ALL_TECHNOLOGIES["computer-vision"];

export const Route = createFileRoute("/technologies/expertise/computer-vision")({
  head: () => buildTechnologyHead(C),
  component: () => <TechnologyDetailPage content={C} complementaryLookup={TECH_LOOKUP} />,
});
