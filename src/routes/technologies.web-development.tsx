import { createFileRoute } from "@tanstack/react-router";
import { ServiceDetailPage, buildServiceHead } from "@/components/site/ServiceDetailPage";
import { SERVICES } from "@/content/services";

const C = SERVICES["web-development"];
export const Route = createFileRoute("/technologies/web-development")({
  head: () => buildServiceHead(C),
  component: () => <ServiceDetailPage content={C} />,
});
