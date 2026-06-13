import { createFileRoute } from "@tanstack/react-router";
import { ServiceDetailPage, buildServiceHead } from "@/components/site/ServiceDetailPage";
import { SERVICES } from "@/content/services";

const C = SERVICES["ui-ux-design"];
export const Route = createFileRoute("/technologies/ui-ux-design")({
  head: () => buildServiceHead(C),
  component: () => <ServiceDetailPage content={C} />,
});
