import { createFileRoute } from "@tanstack/react-router";
import { EngagementDetailPage, buildEngagementHead } from "@/components/site/EngagementDetailPage";
import { ENGAGEMENT_MODELS } from "@/content/engagement";

const C = ENGAGEMENT_MODELS["dedicated-development-team"];
export const Route = createFileRoute("/technologies/engagement/dedicated-development-team")({
  head: () => buildEngagementHead(C),
  component: () => <EngagementDetailPage content={C} />,
});
