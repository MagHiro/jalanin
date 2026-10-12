import { redirect } from "next/navigation";
import { getSessionUser, isAdminUser } from "@/lib/auth/require";
import { WorkspaceRail } from "@/components/layout/workspace-rail";

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
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[232px_minmax(0,1fr)] lg:gap-8">
        <WorkspaceRail
          variant="light"
          eyebrow="Student"
          title="My workspace"
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
        />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
