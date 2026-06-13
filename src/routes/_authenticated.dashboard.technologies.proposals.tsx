import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dashboard/technologies/proposals")({
  component: () => <Outlet />,
});
