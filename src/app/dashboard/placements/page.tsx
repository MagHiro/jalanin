import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/require";
import { db } from "@/lib/db/client";
import { placements } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { BriefcaseBusiness, MapPin, CalendarDays, ArrowRight } from "lucide-react";
import { StudentRecordsMotion } from "@/components/motion/student-records-motion";
import "../student-records.css";

export const metadata = { title: "My placements" };
export const dynamic = "force-dynamic";

export default async function StudentPlacementsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login?next=/dashboard/placements");
  const rows = await db.select().from(placements).where(eq(placements.studentUserId, user.id)).orderBy(desc(placements.updatedAt));
  return <StudentRecordsMotion>
    <PageHeader title="My placements" description="The placements arranged for you, including your organization, dates, and current progress." />
    <section className="student-placement-collection" aria-label="Your placement records">
      <div className="placement-collection-heading"><span className="eyebrow">Your arranged opportunities</span><span>{rows.length} {rows.length === 1 ? "placement" : "placements"}</span></div>
      {rows.length > 0 && <ul className="student-placement-cards">{rows.map(p => <li key={p.id} className="student-placement-card"><header><span className="placement-role-icon"><BriefcaseBusiness size={24} aria-hidden="true"/></span><StatusBadge status={p.placementStatus}/></header><p className="eyebrow">{p.organization}</p><h2>{p.role}</h2><dl><div><dt><MapPin size={16} aria-hidden="true"/> Location</dt><dd>{p.countryCode}</dd></div><div><dt><CalendarDays size={16} aria-hidden="true"/> Schedule</dt><dd>{p.startDate ?? "Start to be confirmed"} — {p.endDate ?? "End to be confirmed"}</dd></div></dl><details className="placement-record-details"><summary>Placement details</summary><p>{p.notes || "No additional notes from the team yet."}</p><Link href="/#contact">Ask about this placement <ArrowRight size={15}/></Link></details></li>)}</ul>}
      {!rows.length && <div className="placement-empty-state"><div><h2>No placements yet</h2><p>Once the team records a placement for you, you’ll find the organization, role, schedule and progress here.</p><div className="placement-empty-actions"><Link className="btn btn-primary" href="/dashboard/applications">View applications <ArrowRight size={16} aria-hidden="true"/></Link><Link className="btn btn-outline" href="/opportunities">Explore internships</Link></div></div></div>}
      <p className="crm-student-help">Placement records are managed by the Jalanin team. <Link href="/#contact">Contact us</Link> if something needs attention.</p>
    </section>
  </StudentRecordsMotion>;
}
