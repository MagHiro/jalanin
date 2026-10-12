import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/require";
import { listStudentApplications } from "@/features/applications/service";
import { db } from "@/lib/db/client";
import { placements } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { statusBadgeClass } from "@/components/ui/cn";

// Student overview (D04): own drafts, submitted applications, placement
// history. No payment UI (B02 undecided, D13 excluded).
export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login?next=/dashboard");

  const apps = await listStudentApplications(user.id);
  const studentPlacements = await db
    .select()
    .from(placements)
    .where(eq(placements.studentUserId, user.id));
  const drafts = apps.filter((a) => a.application.isDraft);
  const submitted = apps.filter((a) => !a.application.isDraft);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Your dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">
          Track your drafts, applications, quotations, and placements.
          Quotations arrive by email; statuses update here automatically.
        </p>
      </div>

      <section aria-labelledby="apps-h">
        <div className="flex items-baseline justify-between">
          <h2 id="apps-h" className="text-xl font-semibold">Applications ({submitted.length})</h2>
          <Link href="/dashboard/applications" className="text-sm font-medium text-emerald-700 hover:underline">View all</Link>
        </div>
        {submitted.length === 0 && drafts.length === 0 ? (
          <div className="mt-3 rounded-xl border border-dashed p-8 text-center">
            <p className="font-semibold">No applications yet.</p>
            <p className="mt-1 text-sm text-slate-600">Find a placement and apply — your draft saves automatically.</p>
            <Link href="/opportunities" className="mt-3 inline-block rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">
              Browse internships
            </Link>
          </div>
        ) : (
          <ul className="mt-3 grid gap-3 md:grid-cols-2">
            {submitted.slice(0, 4).map(({ application, internshipTitle, internshipCity, internshipCountry }) => (
              <li key={application.id} className="rounded-xl border p-4">
                <p className="font-semibold">{internshipTitle}</p>
                <p className="text-xs text-slate-500">{internshipCity}, {internshipCountry}</p>
                <p className="mt-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(application.lifecycleStatus)}`}>
                    {application.lifecycleStatus}
                  </span>
                  {application.needsReReview && (
                    <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                      Updated — in re-review
                    </span>
                  )}
                </p>
                <Link href={`/dashboard/applications/${application.id}`} className="mt-2 inline-block text-sm font-medium text-emerald-700 hover:underline">
                  View details
                </Link>
              </li>
            ))}
          </ul>
        )}
        {drafts.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold">Saved drafts ({drafts.length})</h3>
            <ul className="mt-2 space-y-2">
              {drafts.map(({ application, internshipTitle }) => (
                <li key={application.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                  <span>{internshipTitle} <span className="text-slate-500">— draft</span></span>
                  <Link href={`/apply/${application.internshipId}`} className="font-medium text-emerald-700 hover:underline">
                    Resume
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section aria-labelledby="placements-h">
        <div className="flex items-baseline justify-between">
          <h2 id="placements-h" className="text-xl font-semibold">Placements ({studentPlacements.length})</h2>
          <Link href="/dashboard/placements" className="text-sm font-medium text-emerald-700 hover:underline">View all</Link>
        </div>
        {studentPlacements.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed p-6 text-center text-sm text-slate-500">
            No placements yet. When our team arranges a placement for you, it will appear here.
          </p>
        ) : (
          <ul className="mt-3 grid gap-3 md:grid-cols-2">
            {studentPlacements.slice(0, 4).map((p) => (
              <li key={p.id} className="rounded-xl border p-4">
                <p className="font-semibold">{p.role} · {p.organization}</p>
                <p className="mt-1">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(p.placementStatus)}`}>
                    {p.placementStatus}
                  </span>
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export const dynamic = "force-dynamic";
