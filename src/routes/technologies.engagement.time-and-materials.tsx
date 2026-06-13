import { createFileRoute } from "@tanstack/react-router";
import { EngagementDetailPage, buildEngagementHead } from "@/components/site/EngagementDetailPage";
import { ENGAGEMENT_MODELS } from "@/content/engagement";

const C = ENGAGEMENT_MODELS["time-and-materials"];
export const Route = createFileRoute("/technologies/engagement/time-and-materials")({
  head: () => buildEngagementHead(C),
  component: () => <EngagementDetailPage content={C} />,
});
