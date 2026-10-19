import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/require";
import { db } from "@/lib/db/client";
import { placements } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { CrmTableMeta } from "@/components/ui/crm-list";

export const metadata = { title: "My placements" };
export const dynamic = "force-dynamic";

export default async function StudentPlacementsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login?next=/dashboard/placements");
  const rows = await db.select().from(placements).where(eq(placements.studentUserId, user.id)).orderBy(desc(placements.updatedAt));
  return <div className="crm-list-page">
    <PageHeader icon="✦" eyebrow="My workspace / Placements" title="My placements" description="The placements arranged for you, including your organization, dates, and current progress." />
    <section className="crm-records" aria-label="Your placement records">
      <CrmTableMeta total={rows.length} page={1} pageSize={rows.length || 1} noun="placements" note="Only placements associated with your account are visible." />
      {rows.length ? <>
        <div className="crm-table-scroll hidden md:block"><table className="crm-table">
          <thead><tr><th scope="col">Role / Organization</th><th scope="col">Location</th><th scope="col">Schedule</th><th scope="col">Progress</th><th scope="col">Additional notes</th></tr></thead>
          <tbody>{rows.map(p => <tr key={p.id}>
            <td><span className="crm-record-name">{p.role}</span><span className="crm-record-sub">{p.organization}</span></td>
            <td className="crm-record-secondary">{p.countryCode}</td>
            <td className="crm-date tnum">{p.startDate ?? "TBC"} – {p.endDate ?? "TBC"}</td>
            <td><StatusBadge status={p.placementStatus} /></td>
            <td>{p.notes ? <details className="crm-inbox-details"><summary>View notes</summary><p className="crm-inbox-message">{p.notes}</p></details> : <span className="crm-record-sub">No notes</span>}</td>
          </tr>)}</tbody>
        </table></div>
        <ul className="crm-mobile-records md:hidden">{rows.map(p => <li key={p.id}><div className="crm-mobile-top"><span className="crm-record-name">{p.role}</span><StatusBadge status={p.placementStatus} /></div><p>{p.organization} · {p.countryCode}</p><p className="crm-record-sub tnum">{p.startDate ?? "Start TBC"} – {p.endDate ?? "End TBC"}</p>{p.notes && <details className="crm-inbox-details"><summary>View notes</summary><p className="crm-inbox-message">{p.notes}</p></details>}</li>)}</ul>
      </> : <div className="crm-empty"><EmptyState icon="✦" title="No placements yet" body="When the team arranges a placement for you, the organization, role, dates, and progress will appear here." actionHref="/dashboard/applications" actionLabel="View applications" /></div>}
      <p className="crm-student-help">Placement records are managed by the Jalanin team. <Link href="/contact">Contact us</Link> if something needs attention.</p>
    </section>
  </div>;
}
