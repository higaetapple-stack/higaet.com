import { createFileRoute } from "@tanstack/react-router";
import { EngagementDetailPage, buildEngagementHead } from "@/components/site/EngagementDetailPage";
import { ENGAGEMENT_MODELS } from "@/content/engagement";

const C = ENGAGEMENT_MODELS["staff-augmentation"];
export const Route = createFileRoute("/technologies/engagement/staff-augmentation")({
  head: () => buildEngagementHead(C),
  component: () => <EngagementDetailPage content={C} />,
});
