import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require";
import { listAdminNotifications, markNotificationRead } from "@/features/admin/service";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { CrmViews, CrmTableMeta, listHref } from "@/components/ui/crm-list";

export const metadata = { title: "Notifications", robots: "noindex" };
export const dynamic = "force-dynamic";
const path = "/admin/notifications";

export default async function AdminNotificationsPage({ searchParams }: {
  searchParams: Record<string, string | undefined>;
}) {
  await requireAdmin();
  const unreadOnly = searchParams.unread === "1";
  const rawPage = Number(searchParams.page ?? 1);
  const page = Number.isSafeInteger(rawPage) ? Math.max(1, Math.min(100000, rawPage)) : 1;
  const pageSize = 50;
  const { rows, total } = await listAdminNotifications({
    unreadOnly: unreadOnly ? true : undefined, page, pageSize,
  });
  const returnHref = listHref(path, searchParams, { page: searchParams.page ?? null });

  async function markRead(formData: FormData) {
    "use server";
    await requireAdmin();
    const id = String(formData.get("id") ?? "");
    if (id) await markNotificationRead(id);
    redirect(returnHref);
  }

  return <div className="crm-list-page">
    <PageHeader eyebrow="Communication / Alerts" title="Notifications" description="Application submissions and revisions requiring team attention." />
    <CrmViews label="Notification views" items={[
      { label: "All notifications", href: listHref(path, searchParams, { unread: null }), active: !unreadOnly },
      { label: "Unread", href: listHref(path, searchParams, { unread: "1" }), active: unreadOnly },
    ]} />
    <section className="crm-records" aria-label="Admin notifications">
      <CrmTableMeta total={total} page={page} pageSize={pageSize} noun="notifications" note="Read state is stored and persists across sessions." />
      {rows.length ? <>
        <div className="crm-table-scroll hidden md:block"><table className="crm-table">
          <thead><tr><th scope="col">Event</th><th scope="col">Application</th><th scope="col">Received</th><th scope="col">State</th><th scope="col" className="crm-col-action">Action</th></tr></thead>
          <tbody>{rows.map(({ notification, applicationEmail, internshipTitle }) => <tr key={notification.id} className={!notification.isRead ? "crm-row-unread" : undefined}>
            <td><span className="crm-record-name">{notification.eventType === "new_application" ? "New application" : "Student revision"}</span><span className="crm-record-sub">{notification.eventType === "new_application" ? "Submission received" : "Re-review required"}</span></td>
            <td><span className="crm-record-secondary">{internshipTitle ?? "—"}</span><span className="crm-record-sub">{applicationEmail ?? "—"}</span></td>
            <td className="crm-date"><time dateTime={new Date(notification.createdAt).toISOString()}>{new Date(notification.createdAt).toLocaleDateString("en-SG", { day: "2-digit", month: "short", year: "numeric" })}</time></td>
            <td><span className={notification.isRead ? "crm-read-state" : "crm-unread-state"}>{notification.isRead ? "Read" : "Unread"}</span></td>
            <td className="crm-col-action"><div className="crm-notification-actions">
              {notification.applicationId && <Link className="crm-row-link" href={`/admin/applications/${notification.applicationId}`}>Open record</Link>}
              {!notification.isRead && <form action={markRead}><input type="hidden" name="id" value={notification.id} /><button type="submit" className="crm-row-link">Mark read</button></form>}
            </div></td>
          </tr>)}</tbody>
        </table></div>
        <ul className="crm-mobile-records md:hidden">{rows.map(({ notification, applicationEmail, internshipTitle }) => <li key={notification.id}>
          <div className="crm-mobile-top"><span className="crm-record-name">{notification.eventType === "new_application" ? "New application" : "Student revision"}</span><span className={notification.isRead ? "crm-read-state" : "crm-unread-state"}>{notification.isRead ? "Read" : "Unread"}</span></div>
          <p>{internshipTitle ?? "—"}</p><span className="crm-record-sub">{applicationEmail ?? "—"} · {new Date(notification.createdAt).toLocaleDateString("en-SG")}</span>
          <div className="crm-mobile-bottom">{notification.applicationId && <Link href={`/admin/applications/${notification.applicationId}`} className="crm-row-link">Open record</Link>}{!notification.isRead && <form action={markRead}><input type="hidden" name="id" value={notification.id} /><button type="submit" className="crm-row-link">Mark read</button></form>}</div>
        </li>)}</ul>
      </> : <div className="crm-empty"><EmptyState icon="●" title={unreadOnly ? "No unread alerts" : "No notifications yet"} body="New applications and revision events appear here when there is something to review." actionHref={path} actionLabel="Show all notifications" /></div>}
      <Pagination page={page} totalPages={Math.max(1, Math.ceil(total / pageSize))} pathname={path} searchParams={searchParams} total={total} pageSize={pageSize} />
    </section>
  </div>;
}
