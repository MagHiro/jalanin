import Link from "next/link";

// User-friendly not-found states (PRD WEB-08/JOB-09): no private data leaks,
// actionable next step. Unpublished internships and unknown private ids land here.
export default function NotFound() {
  return (
    <div className="public-state mx-auto max-w-xl py-16 text-center md:py-24">
      <p aria-hidden="true" className="mx-auto grid size-16 place-items-center rounded-3xl bg-secondary text-3xl text-primary">🧭</p>
      <p className="eyebrow mt-6 !text-center">404 — not found</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">Page not found</h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
        This page does not exist, is no longer published, or you do not have
        access to it.
      </p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Link href="/opportunities" className="btn btn-primary">
          Browse internships
        </Link>
        <Link href="/" className="btn btn-outline">
          Home
        </Link>
      </div>
    </div>
  );
}
