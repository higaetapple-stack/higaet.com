import { createFileRoute } from "@tanstack/react-router";
import { EngagementDetailPage, buildEngagementHead } from "@/components/site/EngagementDetailPage";
import { ENGAGEMENT_MODELS } from "@/content/engagement";

const C = ENGAGEMENT_MODELS["fixed-price-projects"];
export const Route = createFileRoute("/technologies/engagement/fixed-price-projects")({
  head: () => buildEngagementHead(C),
  component: () => <EngagementDetailPage content={C} />,
});
