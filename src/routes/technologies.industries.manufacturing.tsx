import { createFileRoute } from "@tanstack/react-router";
import { IndustryDetailPage, buildIndustryHead } from "@/components/site/IndustryDetailPage";
import { ALL_INDUSTRIES } from "@/content/industries.index";
const C = ALL_INDUSTRIES["manufacturing"];
export const Route = createFileRoute("/technologies/industries/manufacturing")({
  head: () => buildIndustryHead(C),
  component: () => <IndustryDetailPage content={C} />,
});
