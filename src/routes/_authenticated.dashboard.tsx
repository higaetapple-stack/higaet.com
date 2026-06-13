import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { RoleSidebar } from "@/components/dashboard/RoleSidebar";
import { getMyProfile, getMyRoles } from "@/lib/auth.functions";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — HIGAET" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardLayout,
});

function DashboardLayout() {
  const fetchProfile = useServerFn(getMyProfile);
  const fetchRoles = useServerFn(getMyRoles);

  const profileQuery = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => fetchProfile(),
  });
  const rolesQuery = useQuery({
    queryKey: ["my-roles"],
    queryFn: () => fetchRoles(),
  });

  const roles = rolesQuery.data ?? [];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DashboardHeader fullName={profileQuery.data?.full_name} email={profileQuery.data?.email} />
      <div className="flex-1 flex">
        <RoleSidebar roles={roles} />
        <main className="flex-1 min-w-0 p-6 lg:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
