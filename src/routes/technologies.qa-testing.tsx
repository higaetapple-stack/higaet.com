import { createFileRoute } from "@tanstack/react-router";
import { ServiceDetailPage, buildServiceHead } from "@/components/site/ServiceDetailPage";
import { SERVICES } from "@/content/services";

const C = SERVICES["qa-testing"];
export const Route = createFileRoute("/technologies/qa-testing")({
  head: () => buildServiceHead(C),
  component: () => <ServiceDetailPage content={C} />,
});
