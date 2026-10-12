import Link from "next/link";

// User-friendly not-found states (PRD WEB-08/JOB-09): no private data leaks,
// actionable next step. Unpublished internships and unknown private ids land here.
export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl py-16 text-center">
      <h1 className="text-3xl font-bold">Page not found</h1>
      <p className="mt-2 text-sm text-slate-600">
        This page does not exist, is no longer published, or you do not have
        access to it.
      </p>
      <div className="mt-6 flex justify-center gap-3 text-sm">
        <Link
          href="/opportunities"
          className="rounded-lg bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800"
        >
          Browse internships
        </Link>
        <Link href="/" className="rounded-lg border px-4 py-2 font-medium hover:bg-slate-50">
          Home
        </Link>
      </div>
    </div>
  );
}
