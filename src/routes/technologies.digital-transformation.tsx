import { createFileRoute } from "@tanstack/react-router";
import { ServiceDetailPage, buildServiceHead } from "@/components/site/ServiceDetailPage";
import { SERVICES } from "@/content/services";

const C = SERVICES["digital-transformation"];
export const Route = createFileRoute("/technologies/digital-transformation")({
  head: () => buildServiceHead(C),
  component: () => <ServiceDetailPage content={C} />,
});
