"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    setError(null);
    const email = String(new FormData(e.currentTarget).get("email") ?? "");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!res.ok || !data?.ok) throw new Error(data?.error ?? "Request failed.");
      setState("sent");
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Request failed.");
    }
  }

  if (state === "sent") {
    return (
      <div className="surface-card mx-auto max-w-md p-6 md:p-8" role="status">
        <p aria-hidden="true" className="grid size-12 place-items-center rounded-2xl bg-secondary text-xl text-primary">✉</p>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">Check your email</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          If an account exists for that address, a time-limited reset link is on its way.
          The link expires — request a new one if it lapses.
        </p>
        <Link href="/auth/login" className="btn btn-outline mt-5 w-full">
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <div className="surface-card mx-auto max-w-md p-6 md:p-8">
      <p className="eyebrow">Account recovery</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">Forgot your password?</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">Enter your account email to receive a reset link.</p>
      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        <label className="field-label">
          <span>Email</span>
          <input name="email" type="email" required autoComplete="email" placeholder="you@example.com" className="field" />
        </label>
        {state === "error" && error && <p role="alert" className="alert alert-error">{error}</p>}
        <button type="submit" disabled={state === "sending"} className="btn btn-primary w-full">
          {state === "sending" ? "Sending…" : "Send reset link"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm">
        <Link href="/auth/login" className="inline-flex min-h-10 items-center font-medium text-primary hover:underline">Back to log in</Link>
      </p>
    </div>
  );
}
