import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, CalendarDays, ClipboardList, ShieldCheck } from "lucide-react";
import { requireAdmin } from "@/lib/auth/require";
import { getAdminStudent } from "@/features/admin/service";
import { StatusBadge } from "@/components/ui/status-badge";
import { PlacementGraphic } from "@/components/ui/placement-graphic";
import { StudentProfileMotion } from "@/components/motion/student-profile-motion";
import "./profile.css";

export const metadata = { title: "Student record", robots: "noindex" };
export const dynamic = "force-dynamic";

export default async function AdminStudentDetailPage({ params }: { params: { id: string } }) {
  await requireAdmin();
  const data = await getAdminStudent(params.id);
  if (!data) notFound();
  const name = data.profile.displayName || "Unnamed student";
  const initials = name.trim().split(/\s+/).slice(0, 2).map(word => word[0] || "").join("").toUpperCase();
  const submitted = data.applications.filter(item => !item.application.isDraft).length;

  return <StudentProfileMotion>
    <div className="workspace-student-record-heading">
      <Link href="/admin/students" className="workspace-back-link"><ArrowLeft size={15} /> Student directory</Link>
      <div className="workspace-student-record-title">
        <span className="workspace-student-record-avatar" aria-hidden="true">{initials || "S"}</span>
        <div>
          <p className="workspace-kicker">Student profile</p>
          <h1>{name}</h1>
          <p className="student-record-intro">Applications, placement outcomes and account information.</p>
        </div>
      </div>
      <div className="workspace-student-record-stats">
        <a href="#student-applications"><span>Applications</span><strong className="tnum">{data.applications.length}</strong><small>View records <ArrowRight size={14} /></small></a>
        <a href="#student-applications"><span>Submitted</span><strong className="tnum">{submitted}</strong><small>{data.applications.length - submitted} saved drafts</small></a>
        <a href="#student-placements"><span>Placements</span><strong className="tnum">{data.placements.length}</strong><small>View outcomes <ArrowRight size={14} /></small></a>
      </div>
    </div>

    <div className="workspace-student-record-grid">
      <div className="workspace-student-record-main">
        <section className="workspace-record-section" aria-labelledby="student-applications">
          <div className="workspace-record-section-title">
            <div><h2 id="student-applications">Applications</h2></div>
            <span className="workspace-record-section-count tnum">{data.applications.length} total</span>
          </div>
          {data.applications.length ? <ul className="workspace-record-rows">
            {data.applications.map(({ application, internshipTitle }) => <li key={application.id}>
              <div className="student-application-card-body"><span className="student-record-item-icon" aria-hidden="true"><ClipboardList size={20} /></span><div><Link className="workspace-record-row-title" href={"/admin/applications/" + application.id}>{internshipTitle}</Link>
              <p>Revision r{application.revision} · {application.submittedAt ? new Date(application.submittedAt).toLocaleDateString("en-SG", { day: "2-digit", month: "short", year: "numeric" }) : "Saved draft"}</p></div>
              </div>
              <dl className="student-application-context"><div><dt>Education</dt><dd>{application.university || "Not provided"}</dd></div><div><dt>Course</dt><dd>{application.course || "Not provided"}</dd></div></dl>
              <div className="workspace-record-row-actions"><StatusBadge status={application.isDraft ? "Draft" : application.lifecycleStatus} /><Link href={"/admin/applications/" + application.id} aria-label={"Review " + internshipTitle}>Review application <ArrowRight size={17}/></Link></div>
            </li>)}
          </ul> : <div className="workspace-record-empty"><p>No linked applications yet. Submitted student applications will appear here when available.</p><Link href="/admin/applications">Browse application queue <ArrowRight size={14}/></Link></div>}
        </section>
        <section className="workspace-record-section" aria-labelledby="student-placements">
          <div className="workspace-record-section-title">
            <div><h2 id="student-placements">Placements</h2></div>
            <span className="workspace-record-section-count tnum">{data.placements.length} total</span>
          </div>
          {data.placements.length ? <ul className="workspace-record-rows">
            {data.placements.map(p => <li key={p.id}><div><Link href={"/admin/placements/" + p.id + "/edit"} className="workspace-record-row-title">{p.role}</Link><p>{p.organization} · {p.countryCode} · {p.startDate || "Dates to confirm"}</p></div><div className="workspace-record-row-actions"><StatusBadge status={p.placementStatus}/><Link href={"/admin/placements/" + p.id + "/edit"} aria-label={"Manage " + p.role}><ArrowRight size={17}/></Link></div></li>)}
          </ul> : <div className="workspace-record-empty"><PlacementGraphic /><h3>No placements yet</h3><p>Record an arranged placement to keep the host, role and progress together.</p><Link href={`/admin/placements/new?student=${data.profile.userId}`}>Create a placement <ArrowRight size={14}/></Link></div>}
        </section>
      </div>
      <aside className="workspace-student-record-side" aria-label="Student information">
        <section className="workspace-record-section">
          <div className="workspace-record-section-title"><div><h2>Profile details</h2></div></div>
          <dl className="workspace-student-facts">
            <div><dt><CalendarDays size={15}/> Joined</dt><dd className="tnum">{new Date(data.profile.createdAt).toLocaleDateString("en-SG", { day: "2-digit", month: "short", year: "numeric" })}</dd></div>
            <div><dt><CalendarDays size={15}/> Last updated</dt><dd className="tnum">{new Date(data.profile.updatedAt).toLocaleDateString("en-SG", { day: "2-digit", month: "short", year: "numeric" })}</dd></div>
          </dl>
          <Link href={`/admin/placements/new?student=${data.profile.userId}`} className="btn btn-outline btn-sm mt-3 w-full">Create placement for this student</Link>
          <details className="student-record-reference"><summary>Account reference</summary><p className="tnum">{data.profile.userId}</p></details>
          <div className="workspace-student-privacy"><ShieldCheck size={17}/><span>Account details are visible only within the authorized admin workspace.</span></div>
        </section>
        <nav className="workspace-record-section workspace-student-links" aria-label="Related management">
          <p className="workspace-kicker">Quick navigation</p>
          <Link href="/admin/applications"><ClipboardList size={17}/> Application queue <ArrowRight size={15}/></Link>
          <Link href="/admin/placements"><BriefcaseBusiness size={17}/> Placement records <ArrowRight size={15}/></Link>
        </nav>
      </aside>
    </div>
  </StudentProfileMotion>;
}
