import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require";
import { getAdminStudent } from "@/features/admin/service";
import { statusBadgeClass } from "@/components/ui/cn";

export const metadata = { title: "Student record", robots: "noindex" };
export const dynamic = "force-dynamic";

export default async function AdminStudentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  await requireAdmin();
  const data = await getAdminStudent(params.id);
  if (!data) notFound();
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/students" className="text-sm text-emerald-700 hover:underline">← All students</Link>
        <h1 className="mt-1 text-2xl font-bold">{data.profile.displayName ?? "(no name)"}</h1>
      </div>
      <section className="rounded-xl border p-5 text-sm">
        <h2 className="font-semibold">Applications ({data.applications.length})</h2>
        <ul className="mt-2 space-y-2">
          {data.applications.map(({ application, internshipTitle }) => (
            <li key={application.id} className="flex items-center justify-between gap-2 border-b py-1">
              <span>{internshipTitle}
                <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(application.lifecycleStatus)}`}>
                  {application.isDraft ? "Draft" : application.lifecycleStatus}
                </span>
              </span>
              <Link href={`/admin/applications/${application.id}`} className="font-medium text-emerald-700 hover:underline">Review</Link>
            </li>
          ))}
          {data.applications.length === 0 && <li className="text-slate-500">No applications.</li>}
        </ul>
      </section>
      <section className="rounded-xl border p-5 text-sm">
        <h2 className="font-semibold">Placements ({data.placements.length})</h2>
        <ul className="mt-2 space-y-1">
          {data.placements.map((p) => (
            <li key={p.id} className="border-b py-1">
              {p.role} · {p.organization}
              <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(p.placementStatus)}`}>{p.placementStatus}</span>
            </li>
          ))}
          {data.placements.length === 0 && <li className="text-slate-500">No placements.</li>}
        </ul>
      </section>
    </div>
  );
}
