import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getPublishedInternshipBySlug,
  COUNTRY_NAMES,
} from "@/features/internships/service";

export const revalidate = 120;

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const row = await getPublishedInternshipBySlug(params.slug);
  if (!row) return { title: "Internship not found" };
  return {
    title: row.internship.title,
    description: `${row.internship.title} in ${row.internship.city}, ${COUNTRY_NAMES[row.internship.countryCode] ?? row.internship.countryCode}. Apply with a custom quotation.`,
    alternates: { canonical: `/opportunities/${row.internship.slug}` },
  };
}

export default async function InternshipDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  // Unpublished/missing slugs return 404 without leaking private data (JOB-09).
  const row = await getPublishedInternshipBySlug(params.slug);
  if (!row) notFound();
  const { internship, categoryName } = row;

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <article className="space-y-6 lg:col-span-2">
        <div>
          <div className="flex flex-wrap gap-2 text-xs">
            {categoryName && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-800">{categoryName}</span>
            )}
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">
              {internship.city}, {COUNTRY_NAMES[internship.countryCode] ?? internship.countryCode}
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-bold">{internship.title}</h1>
          <p className="mt-1 text-sm text-slate-600">
            {internship.startDate} → {internship.endDate}
            {internship.applicationDeadline
              ? ` · Apply by ${new Date(internship.applicationDeadline).toLocaleDateString("en-SG")}`
              : ""}
          </p>
        </div>
        <section>
          <h2 className="font-semibold">About this placement</h2>
          <p className="mt-1 whitespace-pre-line text-slate-700">{internship.description}</p>
        </section>
        <section>
          <h2 className="font-semibold">Responsibilities</h2>
          <p className="mt-1 whitespace-pre-line text-slate-700">{internship.responsibilities}</p>
        </section>
        <section>
          <h2 className="font-semibold">Requirements</h2>
          <p className="mt-1 whitespace-pre-line text-slate-700">{internship.requirements}</p>
        </section>
      </article>

      {/* Application panel (JOB-07/08) */}
      <aside className="h-fit rounded-xl border p-6 lg:sticky lg:top-6">
        <h2 className="font-semibold">Apply for this internship</h2>
        <dl className="mt-2 space-y-1 text-sm text-slate-600">
          <div className="flex justify-between gap-2"><dt>Location</dt><dd className="text-right font-medium text-slate-800">{internship.city}</dd></div>
          <div className="flex justify-between gap-2"><dt>Start</dt><dd className="text-right font-medium text-slate-800">{internship.startDate}</dd></div>
          <div className="flex justify-between gap-2"><dt>End</dt><dd className="text-right font-medium text-slate-800">{internship.endDate}</dd></div>
        </dl>
        <p className="mt-3 text-sm text-slate-600">
          Jalanin will review your application and prepare a custom quotation.
          You will receive the quotation by email — no fixed prices here.
        </p>
        <Link
          href={`/apply/${internship.id}`}
          className="mt-4 block rounded-lg bg-emerald-700 px-5 py-3 text-center font-semibold text-white hover:bg-emerald-800"
        >
          Apply now
        </Link>
        <p className="mt-2 text-xs text-slate-500">
          You will be asked to log in or create an account first.
        </p>
      </aside>
    </div>
  );
}
