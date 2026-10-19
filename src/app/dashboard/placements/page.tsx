import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/require";
import { db } from "@/lib/db/client";
import { placements } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata = { title: "My placements" };

// Student placement history (D11): admin-managed records, own rows only.
// Quotation/payment amounts are never shown here (D03/D13/B02).
export default async function StudentPlacementsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login?next=/dashboard/placements");
  const rows = await db
    .select()
    .from(placements)
    .where(eq(placements.studentUserId, user.id))
    .orderBy(desc(placements.updatedAt));

  return (
    <div className="space-y-6">
      <PageHeader
        icon="✦"
        eyebrow="Your journey"
        title="My placements"
        description="Placements arranged for you by our team — organization, role, dates and progress."
      />
      {rows.length === 0 ? (
        <EmptyState
          icon="✦"
          title="No placements yet."
          body="When our team arranges a placement for you, its organization, role, dates, and progress will appear here."
          actionHref="/dashboard/applications"
          actionLabel="View my applications"
        />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {rows.map((p) => (
            <li key={p.id} className="surface-card surface-card-hover p-5">
              <p className="font-semibold tracking-tight text-foreground">{p.role}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{p.organization} · {p.countryCode}</p>
              {(p.startDate || p.endDate) && (
                <p className="tnum mt-1.5 text-xs text-muted-foreground">{p.startDate ?? "?"} → {p.endDate ?? "?"}</p>
              )}
              <p className="mt-2.5"><StatusBadge status={p.placementStatus} /></p>
              {p.notes && (
                <p className="mt-2.5 border-t border-border pt-2.5 text-sm leading-6 text-muted-foreground">{p.notes}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
