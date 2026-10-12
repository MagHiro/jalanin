import { requireAdmin } from "@/lib/auth/require";
import { db } from "@/lib/db/client";
import { contactSubmissions } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export const metadata = { title: "Contact inbox", robots: "noindex" };
export const dynamic = "force-dynamic";

// Stored contact submissions for admins (COM-04 storage route).
export default async function AdminContactsPage() {
  await requireAdmin();
  const rows = await db
    .select()
    .from(contactSubmissions)
    .orderBy(desc(contactSubmissions.createdAt))
    .limit(50);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Contact inbox ({rows.length})</h1>
      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-slate-500">No inquiries yet.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((c) => (
            <li key={c.id} className="rounded-xl border p-4 text-sm">
              <p className="font-semibold">{c.name} <span className="font-normal text-slate-500">· {c.email}</span></p>
              {c.subject && <p className="text-slate-600">Subject: {c.subject}</p>}
              <p className="mt-1 whitespace-pre-line">{c.message}</p>
              <p className="mt-1 text-xs text-slate-500">{new Date(c.createdAt).toLocaleString("en-SG")}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
