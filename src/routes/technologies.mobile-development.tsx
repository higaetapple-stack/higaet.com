import { createFileRoute } from "@tanstack/react-router";
import { ServiceDetailPage, buildServiceHead } from "@/components/site/ServiceDetailPage";
import { SERVICES } from "@/content/services";

const C = SERVICES["mobile-development"];
export const Route = createFileRoute("/technologies/mobile-development")({
  head: () => buildServiceHead(C),
  component: () => <ServiceDetailPage content={C} />,
});
