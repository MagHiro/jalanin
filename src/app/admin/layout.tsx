import { redirect } from "next/navigation";
import { requireAdmin, AuthError } from "@/lib/auth/require";
import { getAdminOverview } from "@/features/admin/service";
import { WorkspaceShell } from "@/components/layout/workspace-shell";

// Admin shell: every page under /admin re-verifies the admin role
// server-side (never middleware/UI-only). Private: noindex.
// Dark workspace rail (incident.io-informed geometry, Jalanin indigo).
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let email: string | undefined;
  try {
    const user = await requireAdmin();
    email = user.email ?? undefined;
  } catch (err) {
    if (err instanceof AuthError && err.status === 401) redirect("/auth/login?next=/admin");
    redirect("/");
  }
  const overview = await getAdminOverview();
  const unread = overview.unreadNotifications;

  return (
      <WorkspaceShell
        role="admin"
        email={email}
        switchLink="/dashboard"
        switchLabel="Student view"
        items={[
          { href: "/admin", label: "Overview", icon: "⌂", exact: true },
          { href: "/admin/internships", label: "Internships", icon: "▤" },
          { href: "/admin/applications", label: "Applications", icon: "☰" },
          { href: "/admin/students", label: "Students", icon: "○" },
          { href: "/admin/placements", label: "Placements", icon: "✦" },
          { href: "/admin/contacts", label: "Contact inbox", icon: "✉" },
          { href: "/admin/notifications", label: "Notifications", icon: "●", badge: unread },
        ]}
      >{children}</WorkspaceShell>
  );
}

export const dynamic = "force-dynamic";
