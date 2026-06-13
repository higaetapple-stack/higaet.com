import { createFileRoute } from "@tanstack/react-router";
import { IndustryDetailPage, buildIndustryHead } from "@/components/site/IndustryDetailPage";
import { ALL_INDUSTRIES } from "@/content/industries.index";
const C = ALL_INDUSTRIES["education"];
export const Route = createFileRoute("/technologies/industries/education")({
  head: () => buildIndustryHead(C),
  component: () => <IndustryDetailPage content={C} />,
});
