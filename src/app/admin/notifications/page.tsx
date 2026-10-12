import { requireAdmin } from "@/lib/auth/require";
import {
  listAdminNotifications,
  markNotificationRead,
} from "@/features/admin/service";
import { redirect } from "next/navigation";

export const metadata = { title: "Notifications", robots: "noindex" };
export const dynamic = "force-dynamic";

// Durable admin alerts (D08): new-application + re-review indicators with
// persisted read state — never client-only.
export default async function AdminNotificationsPage({
  searchParams,
}: {
  searchParams: { unread?: string };
}) {
  await requireAdmin();
  const rows = await listAdminNotifications({
    unreadOnly: searchParams.unread === "1" ? true : undefined,
    page: 1,
    pageSize: 50,
  });

  async function markRead(formData: FormData) {
    "use server";
    await requireAdmin();
    const id = String(formData.get("id") ?? "");
    if (id) await markNotificationRead(id);
    redirect("/admin/notifications");
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Notifications</h1>
      <p className="text-sm">
        <a href="/admin/notifications" className="text-emerald-700 hover:underline">All</a>
        {" · "}
        <a href="/admin/notifications?unread=1" className="text-emerald-700 hover:underline">Unread only</a>
      </p>
      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-slate-500">No alerts. New submissions and student revisions will appear here and by email.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map(({ notification, applicationEmail, internshipTitle }) => (
            <li
              key={notification.id}
              className={`rounded-xl border p-4 text-sm ${notification.isRead ? "bg-white" : "border-amber-300 bg-amber-50"}`}
            >
              <p className="font-semibold">
                {notification.eventType === "new_application" ? "New application" : "Re-review required"}
                {!notification.isRead && <span className="ml-2 rounded-full bg-amber-200 px-2 py-0.5 text-xs">unread</span>}
              </p>
              <p className="text-slate-600">
                {applicationEmail ?? "—"} · {internshipTitle ?? "—"} ·
                {" "}{new Date(notification.createdAt).toLocaleString("en-SG")}
              </p>
              <div className="mt-2 flex gap-2">
                {notification.applicationId && (
                  <a href={`/admin/applications/${notification.applicationId}`} className="rounded-lg border px-3 py-1.5 font-medium hover:bg-white">
                    Open application
                  </a>
                )}
                {!notification.isRead && (
                  <form action={markRead}>
                    <input type="hidden" name="id" value={notification.id} />
                    <button className="rounded-lg border px-3 py-1.5 hover:bg-white">Mark read</button>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
