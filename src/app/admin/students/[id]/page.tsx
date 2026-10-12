import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require";
import { getAdminStudent } from "@/features/admin/service";
import { StatusBadge } from "@/components/ui/status-badge";

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
        <nav aria-label="Breadcrumb">
          <Link href="/admin/students" className="inline-flex min-h-10 items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary">
            <span aria-hidden="true">←</span> All students
          </Link>
        </nav>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">{data.profile.displayName ?? "(no name)"}</h1>
        <p className="mt-1 font-mono text-xs text-muted-foreground">User ID: {data.profile.userId}</p>
      </div>
      <section aria-labelledby="s-apps" className="surface-card p-5 md:p-6">
        <h2 id="s-apps" className="text-base font-semibold tracking-tight text-foreground">Applications ({data.applications.length})</h2>
        {data.applications.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No applications.</p>
        ) : (
          <ul className="mt-2 divide-y divide-border text-sm">
            {data.applications.map(({ application, internshipTitle }) => (
              <li key={application.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <span className="text-foreground">{internshipTitle}
                  <span className="ml-2"><StatusBadge status={application.isDraft ? "Draft" : application.lifecycleStatus} /></span>
                </span>
                <Link href={`/admin/applications/${application.id}`} className="inline-flex min-h-9 items-center font-semibold text-primary hover:underline">Review →</Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section aria-labelledby="s-placements" className="surface-card p-5 md:p-6">
        <h2 id="s-placements" className="text-base font-semibold tracking-tight text-foreground">Placements ({data.placements.length})</h2>
        {data.placements.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No placements.</p>
        ) : (
          <ul className="mt-2 divide-y divide-border text-sm">
            {data.placements.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <span className="text-foreground">{p.role} · {p.organization}
                  <span className="ml-2"><StatusBadge status={p.placementStatus} /></span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
