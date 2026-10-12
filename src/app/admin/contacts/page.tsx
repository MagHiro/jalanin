import { requireAdmin } from "@/lib/auth/require";
import { db } from "@/lib/db/client";
import { contactSubmissions } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";

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
    <div className="space-y-5">
      <PageHeader
        icon="✉"
        eyebrow="Inbox"
        title={`Contact inbox (${rows.length})`}
        description="Latest inquiries first. Reply by email — addresses are shown for follow-up."
      />
      {rows.length === 0 ? (
        <EmptyState icon="✉" title="No inquiries yet." body="Contact form submissions from the landing page will appear here." />
      ) : (
        <ul className="space-y-2.5">
          {rows.map((c) => (
            <li key={c.id} className="surface-card p-4 text-sm md:p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-semibold text-foreground">{c.name} <span className="font-normal text-muted-foreground">· <a href={`mailto:${c.email}`} className="text-primary hover:underline">{c.email}</a></span></p>
                <p className="tnum text-xs text-muted-foreground"><time>{new Date(c.createdAt).toLocaleString("en-SG")}</time></p>
              </div>
              {c.subject && <p className="mt-1 font-medium text-foreground">Subject: {c.subject}</p>}
              <p className="mt-1.5 whitespace-pre-line leading-6 text-muted-foreground">{c.message}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
