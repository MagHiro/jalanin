import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/require";
import { db } from "@/lib/db/client";
import { placements } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { statusBadgeClass } from "@/components/ui/cn";

export const metadata = { title: "My placements" };

// Student placement history (D11): admin-managed records, own rows only.
// Quotation/payment amounts are never shown here (D03/D13/B02).
export default async function StudentPlacementsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login?next=/dashboard/placements");
  const rows = await db
    .select()
    .from(placements)
    .where(eq(placements.studentUserId, user.id));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">My placements</h1>
      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-slate-500">
          No placements yet. When our team arranges a placement for you, its
          organization, role, dates, and progress will appear here.
        </p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {rows.map((p) => (
            <li key={p.id} className="rounded-xl border p-4">
              <p className="font-semibold">{p.role}</p>
              <p className="text-sm text-slate-600">{p.organization} · {p.countryCode}</p>
              {(p.startDate || p.endDate) && (
                <p className="mt-1 text-xs text-slate-500">{p.startDate ?? "?"} → {p.endDate ?? "?"}</p>
              )}
              <p className="mt-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(p.placementStatus)}`}>
                  {p.placementStatus}
                </span>
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
