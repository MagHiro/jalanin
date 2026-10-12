"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const password = String(new FormData(e.currentTarget).get("password") ?? "");
    try {
      const { error } = await createSupabaseBrowserClient().auth.updateUser({ password });
      if (error) throw new Error(error.message);
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
    <div className="surface-card mx-auto max-w-md p-6 md:p-8">
      <p className="eyebrow">Account recovery</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">Set a new password</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">Choose a password of at least 8 characters.</p>
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
