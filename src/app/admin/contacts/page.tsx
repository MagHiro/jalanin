import { Search } from "lucide-react";
import { requireAdmin } from "@/lib/auth/require";
import { db } from "@/lib/db/client";
import { contactSubmissions } from "@/lib/db/schema";
import { count, desc, ilike, or } from "drizzle-orm";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { CrmFilterChips, CrmTableMeta, listHref } from "@/components/ui/crm-list";

export const metadata = { title: "Contact inbox", robots: "noindex" };
export const dynamic = "force-dynamic";
const path = "/admin/contacts";

export default async function AdminContactsPage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  await requireAdmin();
  const rawPage = Number(searchParams.page ?? 1);
  const page = Number.isSafeInteger(rawPage) ? Math.max(1, Math.min(100000, rawPage)) : 1;
  const pageSize = 50;
  const query = searchParams.q?.trim().slice(0, 120) || "";
  const where = query ? or(ilike(contactSubmissions.name, `%${query}%`), ilike(contactSubmissions.email, `%${query}%`), ilike(contactSubmissions.subject, `%${query}%`)) : undefined;
  const [rows, counts] = await Promise.all([
    db.select().from(contactSubmissions).where(where).orderBy(desc(contactSubmissions.createdAt), desc(contactSubmissions.id)).limit(pageSize).offset((page - 1) * pageSize),
    db.select({ total: count() }).from(contactSubmissions).where(where),
  ]);
  const total = Number(counts[0]?.total ?? 0);
  const filters = query ? [{ label: `Search: ${query}`, href: listHref(path, searchParams, { q: null }) }] : [];
  return <div className="crm-list-page">
    <PageHeader icon="✉" eyebrow="Communication / Inbox" title="Contact inbox" description="Incoming enquiries from the public website. Reply using the sender’s email address." />
    <section className="crm-records" aria-label="Contact enquiries">
      <form method="get" aria-label="Search contact messages" className="crm-toolbar">
        <label className="crm-search"><Search size={17} aria-hidden="true" /><span className="sr-only">Search name, email or subject</span><input type="search" name="q" defaultValue={query} placeholder="Search sender, email or subject" /></label>
        <button className="btn btn-primary crm-apply" type="submit">Search</button>
      </form>
      <CrmFilterChips filters={filters} clearHref={path} />
      <CrmTableMeta total={total} page={page} pageSize={pageSize} noun="enquiries" note="Newest message first · No automatic reply is sent." />
      {rows.length > 0 ? <>
        <div className="crm-table-scroll hidden md:block"><table className="crm-table crm-inbox-table">
          <thead><tr><th scope="col">Sender</th><th scope="col">Subject / Message</th><th scope="col">Received</th><th scope="col" className="crm-col-action">Reply</th></tr></thead>
          <tbody>{rows.map(c => <tr key={c.id}>
            <td><span className="crm-record-name">{c.name}</span><a href={`mailto:${c.email}`} className="crm-record-sub crm-email">{c.email}</a></td>
            <td><details className="crm-inbox-details"><summary>{c.subject || "General enquiry"}<span className="crm-record-sub crm-inbox-excerpt">{c.message}</span></summary><p className="crm-inbox-message">{c.message}</p></details></td>
            <td className="crm-date"><time dateTime={new Date(c.createdAt).toISOString()}>{new Date(c.createdAt).toLocaleDateString("en-SG", { day: "2-digit", month: "short", year: "numeric" })}</time></td>
            <td className="crm-col-action"><a className="crm-row-link" href={`mailto:${c.email}?subject=${encodeURIComponent(`Re: ${c.subject || "Your enquiry"}`)}`}>Reply</a></td>
          </tr>)}</tbody>
        </table></div>
        <ul className="crm-mobile-records md:hidden">{rows.map(c => <li key={c.id}><div className="crm-mobile-top"><span className="crm-record-name">{c.name}</span><span className="crm-date">{new Date(c.createdAt).toLocaleDateString("en-SG")}</span></div><a href={`mailto:${c.email}`} className="crm-record-sub crm-email">{c.email}</a><details className="crm-inbox-details"><summary>{c.subject || "General enquiry"}</summary><p className="crm-inbox-message">{c.message}</p></details><div className="crm-mobile-bottom"><a href={`mailto:${c.email}`} className="crm-row-link">Reply by email</a></div></li>)}</ul>
      </> : <div className="crm-empty"><EmptyState icon="✉" title="No enquiries in this view" body="New messages will appear here as they arrive through the contact form." actionHref="/contact" actionLabel="View contact page" /></div>}
      <Pagination page={page} totalPages={Math.max(1,Math.ceil(total/pageSize))} pathname={path} searchParams={searchParams} total={total} pageSize={pageSize} />
    </section>
  </div>;
}
