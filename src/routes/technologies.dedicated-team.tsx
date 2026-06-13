import { createFileRoute } from "@tanstack/react-router";
import { ServiceDetailPage, buildServiceHead } from "@/components/site/ServiceDetailPage";
import { SERVICES } from "@/content/services";

const C = SERVICES["dedicated-team"];
export const Route = createFileRoute("/technologies/dedicated-team")({
  head: () => buildServiceHead(C),
  component: () => <ServiceDetailPage content={C} />,
});
