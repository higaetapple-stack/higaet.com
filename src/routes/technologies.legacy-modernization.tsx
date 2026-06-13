import { createFileRoute } from "@tanstack/react-router";
import { ServiceDetailPage, buildServiceHead } from "@/components/site/ServiceDetailPage";
import { SERVICES_EXTRA } from "@/content/services.extra";
const C = SERVICES_EXTRA["legacy-modernization"];
export const Route = createFileRoute("/technologies/legacy-modernization")({
  head: () => buildServiceHead(C),
  component: () => <ServiceDetailPage content={C} />,
});
