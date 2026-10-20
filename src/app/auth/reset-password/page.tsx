"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const password = String(new FormData(e.currentTarget).get("password") ?? "");
    try {
      if (!token) throw new Error("The reset link is invalid. Request a new one.");
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!res.ok || !data?.ok) throw new Error(data?.error ?? "Reset failed — the link may have expired. Request a new one.");
      router.push("/auth/login");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Reset failed — the link may have expired. Request a new one.",
      );
      setBusy(false);
    }
  }

  return (
    <div className="auth-calm-form">
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">Set a new password</h1>
      <p className="auth-calm-intro">Choose a password of at least 8 characters.</p>
      {!token && (
        <p role="alert" className="alert alert-error mt-4">
          This reset link is missing its token. Request a new link below.
        </p>
      )}
      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        <div>
          <label className="field-label" htmlFor="reset-password">
            <span>New password (min. 8 characters)</span>
          </label>
          <div className="relative">
            <input
              id="reset-password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="••••••••"
              className="field pr-20"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-pressed={showPassword}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-1 inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg px-3 text-xs font-semibold text-primary hover:bg-secondary"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>
        {error && <p role="alert" className="alert alert-error">{error}</p>}
        <button type="submit" disabled={busy} className="btn btn-primary w-full">
          {busy ? "Saving…" : "Save new password"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm">
        <Link href="/auth/forgot-password" className="inline-flex min-h-10 items-center font-medium text-primary hover:underline">Request a new link</Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
