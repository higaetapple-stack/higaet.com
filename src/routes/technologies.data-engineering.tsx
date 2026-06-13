import { createFileRoute } from "@tanstack/react-router";
import { ServiceDetailPage, buildServiceHead } from "@/components/site/ServiceDetailPage";
import { SERVICES } from "@/content/services";

const C = SERVICES["data-engineering"];
export const Route = createFileRoute("/technologies/data-engineering")({
  head: () => buildServiceHead(C),
  component: () => <ServiceDetailPage content={C} />,
});
