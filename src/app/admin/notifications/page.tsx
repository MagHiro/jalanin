import { requireAdmin } from "@/lib/auth/require";
import {
  listAdminNotifications,
  markNotificationRead,
} from "@/features/admin/service";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";

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
  const unreadOnly = searchParams.unread === "1";
  const rows = await listAdminNotifications({
    unreadOnly: unreadOnly ? true : undefined,
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
    <div className="space-y-5">
      <PageHeader
        icon="●"
        eyebrow="Alerts"
        title="Notifications"
        description="New submissions and student revisions — persisted, with read state."
        actions={
          unreadOnly ? (
            <a href="/admin/notifications" className="btn btn-outline btn-sm">Show all</a>
          ) : (
            <a href="/admin/notifications?unread=1" className="btn btn-outline btn-sm">Unread only</a>
          )
        }
      />
      {rows.length === 0 ? (
        <EmptyState
          icon="●"
          title={unreadOnly ? "No unread alerts." : "No alerts."}
          body="New submissions and student revisions will appear here and by email."
          actionHref="/admin/notifications"
          actionLabel="Show all"
        />
      ) : (
        <ul className="space-y-2.5">
          {rows.map(({ notification, applicationEmail, internshipTitle }) => (
            <li
              key={notification.id}
              className={`rounded-2xl border p-4 text-sm md:p-5 ${notification.isRead ? "border-border bg-surface" : "notification-unread"}`}
            >
              <p className="flex flex-wrap items-center gap-2 font-semibold text-foreground">
                {notification.eventType === "new_application" ? "New application" : "Re-review required"}
                {!notification.isRead && <span className="badge badge-rereview"><span aria-hidden="true" className="badge-dot" />unread</span>}
              </p>
              <p className="tnum mt-1 text-muted-foreground">
                {applicationEmail ?? "—"} · {internshipTitle ?? "—"} ·
                {" "}<time>{new Date(notification.createdAt).toLocaleString("en-SG")}</time>
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {notification.applicationId && (
                  <a href={`/admin/applications/${notification.applicationId}`} className="btn btn-outline btn-sm !bg-surface">
                    Open application
                  </a>
                )}
                {!notification.isRead && (
                  <form action={markRead}>
                    <input type="hidden" name="id" value={notification.id} />
                    <button className="btn btn-outline btn-sm !bg-surface">Mark read</button>
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
