import { createFileRoute } from "@tanstack/react-router";
import { ServiceDetailPage, buildServiceHead } from "@/components/site/ServiceDetailPage";
import { SERVICES_EXTRA } from "@/content/services.extra";
const C = SERVICES_EXTRA["system-integration"];
export const Route = createFileRoute("/technologies/system-integration")({
  head: () => buildServiceHead(C),
  component: () => <ServiceDetailPage content={C} />,
});
