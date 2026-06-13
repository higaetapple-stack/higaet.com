import { createFileRoute } from "@tanstack/react-router";
import { IndustryDetailPage, buildIndustryHead } from "@/components/site/IndustryDetailPage";
import { ALL_INDUSTRIES } from "@/content/industries.index";
const C = ALL_INDUSTRIES["finance"];
export const Route = createFileRoute("/technologies/industries/finance")({
  head: () => buildIndustryHead(C),
  component: () => <IndustryDetailPage content={C} />,
});
