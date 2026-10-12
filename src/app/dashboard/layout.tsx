import { redirect } from "next/navigation";
import { getSessionUser, isAdminUser } from "@/lib/auth/require";
import { WorkspaceShell } from "@/components/layout/workspace-shell";

// Student shell: workspace rail shared by overview/applications/placements.
// Server-verified session on every page (never UI-only).
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login?next=/dashboard");
  const admin = await isAdminUser(user.id);

  return (
        <WorkspaceShell
          role="student"
          email={user.email ?? undefined}
          switchLink="/opportunities"
          switchLabel="Browse internships"
          items={[
            { href: "/dashboard", label: "Overview", icon: "⌂", exact: true },
            { href: "/dashboard/applications", label: "Applications", icon: "☰" },
            { href: "/dashboard/placements", label: "Placements", icon: "✦" },
            ...(admin
              ? [{ href: "/admin", label: "Admin", icon: "▤" }]
              : []),
          ]}
        >{children}</WorkspaceShell>
  );
}

export const dynamic = "force-dynamic";
