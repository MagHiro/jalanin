import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/require";
import { listStudentApplications } from "@/features/applications/service";
import { statusBadgeClass } from "@/components/ui/cn";

export const metadata = { title: "My applications" };

export default async function StudentApplicationsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login?next=/dashboard/applications");
  const apps = await listStudentApplications(user.id);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">My applications</h1>
      {apps.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-slate-500">
          Nothing here yet. <Link href="/opportunities" className="font-medium text-emerald-700 hover:underline">Browse internships</Link>
        </p>
      ) : (
        <ul className="space-y-3">
          {apps.map(({ application, internshipTitle, internshipCity, internshipCountry, internshipSlug }) => (
            <li key={application.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
              <div>
                <p className="font-semibold">{internshipTitle}</p>
                <p className="text-xs text-slate-500">
                  {internshipCity}, {internshipCountry} ·
                  {application.isDraft
                    ? " draft"
                    : ` submitted ${application.submittedAt ? new Date(application.submittedAt).toLocaleDateString("en-SG") : ""}`}
                </p>
                {!application.isDraft && (
                  <p className="mt-1">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(application.lifecycleStatus)}`}>
                      {application.lifecycleStatus}
                    </span>
                    {application.needsReReview && (
                      <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">Updated — in re-review</span>
                    )}
                  </p>
                )}
              </div>
              <div className="flex gap-2 text-sm">
                {application.isDraft ? (
                  <Link href={`/apply/${application.internshipId}`} className="rounded-lg border px-3 py-1.5 font-medium hover:bg-slate-50">Resume</Link>
                ) : (
                  <Link href={`/dashboard/applications/${application.id}`} className="rounded-lg border px-3 py-1.5 font-medium hover:bg-slate-50">Details</Link>
                )}
                <Link href={`/opportunities/${internshipSlug}`} className="px-3 py-1.5 text-slate-600 hover:underline">Listing</Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
