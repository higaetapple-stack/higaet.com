import { createFileRoute } from "@tanstack/react-router";
import { ServiceDetailPage, buildServiceHead } from "@/components/site/ServiceDetailPage";
import { SERVICES } from "@/content/services";

const C = SERVICES["devops"];
export const Route = createFileRoute("/technologies/devops")({
  head: () => buildServiceHead(C),
  component: () => <ServiceDetailPage content={C} />,
});
