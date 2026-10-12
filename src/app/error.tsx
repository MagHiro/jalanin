"use client";

import Link from "next/link";

/**
 * Route-level error fallback: actionable retry + navigation,
 * never a blank screen or leaked internals.
 */
export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-xl py-16 text-center md:py-24">
      <p aria-hidden="true" className="error-mark">!</p>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-foreground">
        Something went wrong
      </h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
        Please try again. If the problem persists, contact us and mention
        what you were doing.
      </p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <button type="button" onClick={reset} className="btn btn-primary">
          Try again
        </button>
        <Link href="/" className="btn btn-outline">
          Home
        </Link>
      </div>
    </div>
  );
}
