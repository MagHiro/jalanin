import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/require";
import { listStudentApplications } from "@/features/applications/service";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { CrmViews, CrmTableMeta, listHref } from "@/components/ui/crm-list";
import { StudentRecordsMotion } from "@/components/motion/student-records-motion";
import "../student-records.css";

export const metadata = { title: "My applications" };
export const dynamic = "force-dynamic";
const path = "/dashboard/applications";

export default async function StudentApplicationsPage({ searchParams }: { searchParams: { draft?: string; view?: string } }) {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login?next=/dashboard/applications");
  const apps = await listStudentApplications(user.id);
  const drafts = apps.filter(item => item.application.isDraft);
  const submitted = apps.filter(item => !item.application.isDraft);
  const view = searchParams.view === "drafts" ? "drafts" : searchParams.view === "submitted" ? "submitted" : "all";
  const visible = view === "drafts" ? drafts : view === "submitted" ? submitted : apps;

  return <StudentRecordsMotion viewKey={view}>
    {searchParams.draft && <div role="status" className="alert alert-success"><strong>Draft saved.</strong> You can resume it any time. It has not been submitted.</div>}
    <PageHeader title="My applications" description="Track your submissions and continue drafts without losing your progress." actions={<Link href="/opportunities" className="btn btn-primary btn-sm">Browse internships <ArrowRight size={16} aria-hidden="true" /></Link>} />
    <CrmViews label="Application views" items={[
      { label: "All", href: listHref(path, searchParams, { view: null, draft: null }), active: view === "all", count: apps.length },
      { label: "Submitted", href: listHref(path, searchParams, { view: "submitted", draft: null }), active: view === "submitted", count: submitted.length },
      { label: "Drafts", href: listHref(path, searchParams, { view: "drafts", draft: null }), active: view === "drafts", count: drafts.length },
    ]} />
    <section className="crm-records" aria-label="Your application records">
      <CrmTableMeta total={visible.length} page={1} pageSize={visible.length || 1} noun="applications" note="Drafts are not submitted for review." />
      {visible.length > 0 ? <>
        <div className="crm-table-scroll hidden md:block">
          <table className="crm-table"><thead><tr><th scope="col">Internship</th><th scope="col">Location</th><th scope="col">Lifecycle stage</th><th scope="col">Submitted</th><th scope="col" className="crm-col-action">Action</th></tr></thead>
            <tbody>{visible.map(({ application, internshipTitle, internshipCity, internshipCountry, internshipSlug }) => <tr key={application.id}>
              <td><Link href={application.isDraft ? `/apply/${application.internshipId}` : `/dashboard/applications/${application.id}`} className="crm-record-name">{internshipTitle}</Link><Link href={`/opportunities/${internshipSlug}`} className="crm-record-sub crm-email">View listing</Link></td>
              <td className="crm-record-secondary">{internshipCity}, {internshipCountry}</td>
              <td><div className="crm-badge-stack"><StatusBadge status={application.isDraft ? "Draft" : application.lifecycleStatus} />{application.needsReReview && <span className="badge badge-rereview">Re-review</span>}</div></td>
              <td className="crm-date">{application.submittedAt ? new Date(application.submittedAt).toLocaleDateString("en-SG", { day: "2-digit", month: "short", year: "numeric" }) : "Not submitted"}</td>
              <td className="crm-col-action"><Link className="crm-row-link" href={application.isDraft ? `/apply/${application.internshipId}` : `/dashboard/applications/${application.id}`}>{application.isDraft ? "Resume draft" : "View details"}</Link></td>
            </tr>)}</tbody>
          </table>
        </div>
        <ul className="crm-mobile-records md:hidden">{visible.map(({ application, internshipTitle, internshipCity, internshipCountry }) => <li key={application.id}>
          <div className="crm-mobile-top"><Link className="crm-record-name" href={application.isDraft ? `/apply/${application.internshipId}` : `/dashboard/applications/${application.id}`}>{internshipTitle}</Link><StatusBadge status={application.isDraft ? "Draft" : application.lifecycleStatus} /></div>
          <p>{internshipCity}, {internshipCountry}</p>{application.needsReReview && <span className="badge badge-rereview">Re-review required</span>}
          <div className="crm-mobile-bottom"><span className="crm-record-sub">{application.submittedAt ? new Date(application.submittedAt).toLocaleDateString("en-SG") : "Not submitted"}</span><Link className="crm-row-link" href={application.isDraft ? `/apply/${application.internshipId}` : `/dashboard/applications/${application.id}`}>{application.isDraft ? "Resume draft" : "View details"}</Link></div>
        </li>)}</ul>
      </> : <div className="crm-empty"><EmptyState icon="☰" title={view === "drafts" ? "No saved drafts" : view === "submitted" ? "No submitted applications" : "No applications yet"} body={view === "drafts" ? "Drafts appear here after you save an application." : "Explore internships and apply when you find a good fit."} actionHref="/opportunities" actionLabel="Browse internships" /></div>}
      {visible.length > 0 && <div className="crm-student-help">Your application status updates here as the team reviews it. Quotation terms are sent by email. <Link href="/#contact">Need help? <ArrowRight size={13} /></Link></div>}
    </section>
  </StudentRecordsMotion>;
}
