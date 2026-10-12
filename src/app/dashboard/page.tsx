import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/require";
import { listStudentApplications } from "@/features/applications/service";
import { db } from "@/lib/db/client";
import { placements } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Reveal } from "@/components/motion/reveal";

// Student overview (D04): own drafts, submitted applications, placement
// history. No payment UI (B02 undecided, D13 excluded).
export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login?next=/dashboard");

  const apps = await listStudentApplications(user.id);
  const studentPlacements = await db
    .select()
    .from(placements)
    .where(eq(placements.studentUserId, user.id))
    .orderBy(desc(placements.updatedAt));
  const drafts = apps.filter((a) => a.application.isDraft);
  const submitted = apps.filter((a) => !a.application.isDraft);

  return (
    <div className="space-y-8">
      <PageHeader
        icon="⌂"
        eyebrow="Student workspace"
        title="Your journey, all in one place."
        description="Track your drafts, applications, quotations, and placements. Quotations arrive by email; statuses update here automatically."
        actions={
          <>
            <Link href="/opportunities" className="btn btn-primary btn-sm">Find internships</Link>
            {drafts.length > 0 && (
              <Link href="/dashboard/applications" className="btn btn-outline btn-sm">
                Resume {drafts.length} draft{drafts.length === 1 ? "" : "s"}
              </Link>
            )}
          </>
        }
      />

      <section aria-labelledby="apps-h">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="apps-h" className="text-lg font-semibold tracking-tight text-foreground">
            Applications <span className="tnum text-sm font-normal text-muted-foreground">({submitted.length})</span>
          </h2>
          <Link href="/dashboard/applications" className="btn btn-ghost btn-sm">View all <span aria-hidden="true">→</span></Link>
        </div>
        {submitted.length === 0 && drafts.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon="☰"
              title="No applications yet."
              body="Find a placement and apply — your draft saves as you go."
              actionHref="/opportunities"
              actionLabel="Browse internships"
            />
          </div>
        ) : (
          <Reveal>
            <ul className="mt-4 grid gap-3 md:grid-cols-2">
              {submitted.slice(0, 4).map(({ application, internshipTitle, internshipCity, internshipCountry }) => (
                <li data-reveal key={application.id} className="surface-card surface-card-hover p-5">
                  <p className="font-semibold tracking-tight text-foreground">{internshipTitle}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{internshipCity}, {internshipCountry}</p>
                  <p className="mt-2.5 flex flex-wrap gap-1.5">
                    <StatusBadge status={application.lifecycleStatus} />
                    {application.needsReReview && (
                      <span className="badge badge-rereview">
                        <span aria-hidden="true" className="badge-dot" />
                        Updated — re-review required
                      </span>
                    )}
                  </p>
                  <Link href={`/dashboard/applications/${application.id}`} className="mt-3 inline-flex min-h-10 items-center text-sm font-semibold text-primary hover:underline">
                    View details <span aria-hidden="true">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Reveal>
        )}
        {drafts.length > 0 && (
          <div className="mt-5 rounded-2xl border border-border bg-surface p-4 md:p-5">
            <h3 className="text-sm font-semibold tracking-tight text-foreground">Saved drafts ({drafts.length})</h3>
            <ul className="mt-2 divide-y divide-border">
              {drafts.map(({ application, internshipTitle }) => (
                <li key={application.id} className="flex min-h-14 flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                  <span className="text-foreground">{internshipTitle} <span className="text-muted-foreground">— draft</span></span>
                  <Link href={`/apply/${application.internshipId}`} className="inline-flex min-h-10 shrink-0 items-center rounded-lg px-2 font-semibold text-primary hover:underline">
                    Resume →
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section aria-labelledby="placements-h">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="placements-h" className="text-lg font-semibold tracking-tight text-foreground">
            Placements <span className="tnum text-sm font-normal text-muted-foreground">({studentPlacements.length})</span>
          </h2>
          <Link href="/dashboard/placements" className="btn btn-ghost btn-sm">View all <span aria-hidden="true">→</span></Link>
        </div>
        {studentPlacements.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-border bg-surface p-6 text-center text-sm text-muted-foreground">
            No placements yet. When our team arranges a placement for you, it will appear here.
          </p>
        ) : (
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {studentPlacements.slice(0, 4).map((p) => (
              <li key={p.id} className="surface-card surface-card-hover p-5">
                <p className="font-semibold text-foreground">{p.role} · {p.organization}</p>
                {(p.startDate || p.endDate) && (
                  <p className="tnum mt-1 text-xs text-muted-foreground">{p.startDate ?? "?"} → {p.endDate ?? "?"}</p>
                )}
                <p className="mt-2.5"><StatusBadge status={p.placementStatus} /></p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export const dynamic = "force-dynamic";
