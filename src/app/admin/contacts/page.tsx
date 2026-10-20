import { Search } from "lucide-react";
import { requireAdmin } from "@/lib/auth/require";
import { listAdminContacts, type ContactHandlingFilter } from "@/features/admin/service";
import { PageHeader } from "@/components/ui/page-header";
import { AdminRecords } from "@/components/admin/admin-records";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { CrmFilterChips, CrmTableMeta, CrmViews, listHref } from "@/components/ui/crm-list";
import { ContactHandlingControl } from "@/components/admin/contact-handling-control";

export const metadata = { title: "Contact inbox", robots: "noindex" };
export const dynamic = "force-dynamic";
const path = "/admin/contacts";

export default async function AdminContactsPage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  await requireAdmin();
  const rawPage = Number(searchParams.page ?? 1);
  const page = Number.isSafeInteger(rawPage) ? Math.max(1, Math.min(100000, rawPage)) : 1;
  const pageSize = 50;
  const query = searchParams.q?.trim().slice(0, 120) || "";
  const handling: ContactHandlingFilter =
    searchParams.handling === "open" ? "open" : searchParams.handling === "handled" ? "handled" : "all";
  const { rows, total, openCount, handledCount } = await listAdminContacts({
    q: query || undefined,
    handling,
    page,
    pageSize,
  });
  const filters = [
    ...(query ? [{ label: `Search: ${query}`, href: listHref(path, searchParams, { q: null }) }] : []),
    ...(handling !== "all" ? [{ label: `State: ${handling === "open" ? "Open" : "Handled"}`, href: listHref(path, searchParams, { handling: null }) }] : []),
  ];
  return <AdminRecords filters={searchParams}>
    <PageHeader title="Contact inbox" description="Incoming enquiries from the public website. Reply using the sender’s email address." />
    <CrmViews label="Enquiry states" items={[
      { label: "All", href: listHref(path, searchParams, { handling: null }), active: handling === "all", count: total },
      { label: "Open", href: listHref(path, searchParams, { handling: "open" }), active: handling === "open", count: openCount },
      { label: "Handled", href: listHref(path, searchParams, { handling: "handled" }), active: handling === "handled", count: handledCount },
    ]} />
    <section className="crm-records" aria-label="Contact enquiries">
      <form method="get" aria-label="Search contact messages" className="crm-toolbar">
        <label className="crm-search"><Search size={17} aria-hidden="true" /><span className="sr-only">Search name, email or subject</span><input type="search" name="q" defaultValue={query} placeholder="Search sender, email or subject" /></label>
        {handling !== "all" && <input type="hidden" name="handling" value={handling} />}
        <button className="btn btn-primary crm-apply" type="submit">Search</button>
      </form>
      <CrmFilterChips filters={filters} clearHref={path} />
      <CrmTableMeta total={total} page={page} pageSize={pageSize} noun="enquiries" note="Newest message first · No automatic reply is sent." />
      {rows.length > 0 ? <>
        <div className="crm-table-scroll hidden md:block"><table className="crm-table crm-inbox-table">
          <thead><tr><th scope="col">Sender</th><th scope="col">Subject / Message</th><th scope="col">Received</th><th scope="col">State</th><th scope="col" className="crm-col-action">Actions</th></tr></thead>
          <tbody>{rows.map(c => {
            const isHandled = c.handlingStatus === "Handled";
            return <tr key={c.id}>
            <td><span className="crm-record-name">{c.name}</span><a href={`mailto:${c.email}`} className="crm-record-sub crm-email">{c.email}</a></td>
            <td><details className="crm-inbox-details"><summary>{c.subject || "General enquiry"}<span className="crm-record-sub crm-inbox-excerpt">{c.message}</span></summary><p className="crm-inbox-message">{c.message}</p></details></td>
            <td className="crm-date"><time dateTime={new Date(c.createdAt).toISOString()}>{new Date(c.createdAt).toLocaleDateString("en-SG", { day: "2-digit", month: "short", year: "numeric" })}</time></td>
            <td><span className={isHandled ? "badge badge-handled" : "badge badge-open"}><span aria-hidden="true" className="badge-dot" />{isHandled ? "Handled" : "Open"}</span></td>
            <td className="crm-col-action"><span className="crm-action-stack"><a className="crm-row-link" href={`mailto:${c.email}?subject=${encodeURIComponent(`Re: ${c.subject || "Your enquiry"}`)}`}>Reply</a><ContactHandlingControl contactId={c.id} handled={isHandled} /></span></td>
          </tr>;})}</tbody>
        </table></div>
        <ul className="crm-mobile-records md:hidden">{rows.map(c => {
          const isHandled = c.handlingStatus === "Handled";
          return <li key={c.id}><div className="crm-mobile-top"><span className="crm-record-name">{c.name}</span><span className={isHandled ? "badge badge-handled" : "badge badge-open"}><span aria-hidden="true" className="badge-dot" />{isHandled ? "Handled" : "Open"}</span></div><a href={`mailto:${c.email}`} className="crm-record-sub crm-email">{c.email}</a><details className="crm-inbox-details"><summary>{c.subject || "General enquiry"}</summary><p className="crm-inbox-message">{c.message}</p></details><div className="crm-mobile-bottom"><span className="crm-record-sub">{new Date(c.createdAt).toLocaleDateString("en-SG")}</span><span className="crm-action-stack"><a href={`mailto:${c.email}`} className="crm-row-link">Reply</a><ContactHandlingControl contactId={c.id} handled={isHandled} /></span></div></li>;})}</ul>
      </> : <div className="crm-empty"><EmptyState icon="✉" title="No enquiries in this view" body="New messages will appear here as they arrive through the contact form." actionHref="/#contact" actionLabel="View contact section" /></div>}
      <Pagination page={page} totalPages={Math.max(1,Math.ceil(total/pageSize))} pathname={path} searchParams={searchParams} total={total} pageSize={pageSize} />
    </section>
  </AdminRecords>;
}
