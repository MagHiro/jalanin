import { redirect } from "next/navigation";
import { requireAdmin, AuthError } from "@/lib/auth/require";
import { db } from "@/lib/db/client";
import { adminNotifications } from "@/lib/db/schema";
import { count, eq } from "drizzle-orm";
import { WorkspaceShell } from "@/components/layout/workspace-shell";

// Admin shell: every page under /admin re-verifies the admin role
// server-side (never middleware/UI-only). Private: noindex.
// Shared compact product navigation with Jalanin indigo accents.
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
  // The sidebar only needs one indexed unread count. Avoid re-running the
  // full multi-table admin overview aggregation on every nested navigation.
  const unreadRows = await db.select({ n: count() })
    .from(adminNotifications)
    .where(eq(adminNotifications.isRead, false));
  const unread = Number(unreadRows[0]?.n ?? 0);

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
