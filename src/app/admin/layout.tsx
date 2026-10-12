import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin, AuthError } from "@/lib/auth/require";
import { getAdminOverview } from "@/features/admin/service";
import { WorkspaceRail } from "@/components/layout/workspace-rail";

// Admin shell: every page under /admin re-verifies the admin role
// server-side (never middleware/UI-only). Private: noindex.
// Dark workspace rail (incident.io-informed geometry, Jalanin indigo).
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireAdmin();
  } catch (err) {
    if (err instanceof AuthError && err.status === 401) redirect("/auth/login?next=/admin");
    redirect("/");
  }
  const overview = await getAdminOverview();
  const unread = overview.unreadNotifications;

  return (
    <div className="grid gap-6 lg:grid-cols-[232px_minmax(0,1fr)] lg:gap-8">
      <WorkspaceRail
        eyebrow="Workspace"
        title="Jalanin Admin"
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
        footer={
          unread > 0 ? (
            <p className="rail-alert-card">
              <b>{unread} unread alert{unread === 1 ? "" : "s"}</b> — see{" "}
              <Link href="/admin/notifications" className="font-semibold underline">Notifications</Link>.
            </p>
          ) : undefined
        }
      />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export const dynamic = "force-dynamic";
