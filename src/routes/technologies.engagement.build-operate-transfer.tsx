import { createFileRoute } from "@tanstack/react-router";
import { EngagementDetailPage, buildEngagementHead } from "@/components/site/EngagementDetailPage";
import { ENGAGEMENT_MODELS } from "@/content/engagement";

const C = ENGAGEMENT_MODELS["build-operate-transfer"];
export const Route = createFileRoute("/technologies/engagement/build-operate-transfer")({
  head: () => buildEngagementHead(C),
  component: () => <EngagementDetailPage content={C} />,
});
