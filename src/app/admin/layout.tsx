import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin, AuthError } from "@/lib/auth/require";
import { listAdminNotifications } from "@/features/admin/service";

// Admin shell: every page under /admin re-verifies the admin role
// server-side (never middleware/UI-only). Private: noindex.
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
  const notifications = await listAdminNotifications({ page: 1, pageSize: 5 });
  const unread = notifications.length; // header preview only; overview counts authoritatively

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <aside aria-label="Admin navigation" className="h-fit rounded-xl border bg-slate-50 p-4 lg:sticky lg:top-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Admin</p>
        <nav className="mt-2 flex flex-row flex-wrap gap-2 text-sm lg:flex-col">
          {[
            ["/admin", "Overview"],
            ["/admin/internships", "Internships"],
            ["/admin/applications", "Applications"],
            ["/admin/students", "Students"],
            ["/admin/placements", "Placements"],
            ["/admin/contacts", "Contact inbox"],
            ["/admin/notifications", "Notifications"],
          ].map(([href, label]) => (
            <Link key={href} href={href} className="rounded-lg px-3 py-2 font-medium text-slate-700 hover:bg-white hover:text-emerald-800">
              {label}
            </Link>
          ))}
        </nav>
        {unread > 0 && (
          <p className="mt-3 rounded-lg bg-amber-100 p-2 text-xs text-amber-900">
            {unread}+ recent alert(s) — see Notifications.
          </p>
        )}
      </aside>
      <div>{children}</div>
    </div>
  );
}

export const dynamic = "force-dynamic";
