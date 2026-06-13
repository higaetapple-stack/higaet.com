import { createFileRoute } from "@tanstack/react-router";
import { ServiceDetailPage, buildServiceHead } from "@/components/site/ServiceDetailPage";
import { SERVICES_EXTRA } from "@/content/services.extra";
const C = SERVICES_EXTRA["it-consulting"];
export const Route = createFileRoute("/technologies/it-consulting")({
  head: () => buildServiceHead(C),
  component: () => <ServiceDetailPage content={C} />,
});
