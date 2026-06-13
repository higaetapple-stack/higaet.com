import { createFileRoute } from "@tanstack/react-router";
import { EngagementDetailPage, buildEngagementHead } from "@/components/site/EngagementDetailPage";
import { ENGAGEMENT_MODELS } from "@/content/engagement";

const C = ENGAGEMENT_MODELS["offshore-development-center"];
export const Route = createFileRoute("/technologies/engagement/offshore-development-center")({
  head: () => buildEngagementHead(C),
  component: () => <EngagementDetailPage content={C} />,
});
