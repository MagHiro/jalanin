"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { safeNext } from "@/lib/auth/safe-next";

// Email/password authentication per PRD AUTH-* in the shared auth shell.
// E2E asserts: heading "Log in", labelled email/password inputs, submit
// button named "Log in" — preserved verbatim.
export function AuthForm({ mode }: { mode: "login" | "sign-up" }) {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);
  const next = safeNext(params.get("next"));

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    try {
      const res = await fetch(mode === "login" ? "/api/auth/login" : "/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
        emailVerified?: boolean;
      } | null;
      if (!res.ok || !data?.ok) throw new Error(data?.error ?? "Authentication failed.");
      if (mode === "sign-up" && !data.emailVerified) {
        setConfirmationEmail(email);
        setBusy(false);
        return;
      }
      // The native session cookie is set by the API response above; no
      // client-side session mirroring is needed.
      void next;
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
      setBusy(false);
    }
  }

  return (
    <div className="auth-calm-form">
      <div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
          {mode === "login" ? "Log in" : "Create your account"}
        </h1>
        <p className="auth-calm-intro">{mode === "login" ? "Welcome back. Pick up where you left off." : "Take the first step towards your next chapter."}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "login" ? (
            <>New to Jalanin? <Link href={next !== "/dashboard" ? `/auth/sign-up?next=${encodeURIComponent(next)}` : "/auth/sign-up"} className="font-semibold text-primary hover:underline">Sign up</Link></>
          ) : (
            <>Already have an account? <Link href={next !== "/dashboard" ? `/auth/login?next=${encodeURIComponent(next)}` : "/auth/login"} className="font-semibold text-primary hover:underline">Log in</Link></>
          )}
        </p>
        {confirmationEmail ? (
          <div className="auth-calm-confirmation" role="status">
            <h2 className="text-lg font-semibold text-foreground">Check your email</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              We sent a verification link to <strong className="break-all text-foreground">{confirmationEmail}</strong>.
              Open the link to verify your account, then log in. Check your spam folder if it does not arrive.
            </p>
            <Link href="/auth/login" className="btn btn-primary mt-5">Go to log in</Link>
          </div>
        ) : <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate={false}>
          <label className="field-label">
            <span>Email</span>
            <input name="email" type="email" required autoComplete="email" placeholder="you@example.com" className="field" />
          </label>
          <div>
            <label className="field-label" htmlFor={mode === "login" ? "login-password" : "signup-password"}>
              <span>Password {mode === "sign-up" && "(min. 8 characters)"}</span>
            </label>
            <div className="relative">
              <input
                id={mode === "login" ? "login-password" : "signup-password"}
                name="password"
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
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
            {busy ? "Please wait…" : mode === "login" ? "Log in" : "Sign up"}
          </button>
        </form>}
        {mode === "login" ? (
          <p className="mt-4 text-center text-sm">
            <Link href="/auth/forgot-password" className="inline-flex min-h-10 items-center font-medium text-primary hover:underline">Forgot your password?</Link>
          </p>
        ) : (
          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            By signing up you agree to our{" "}
            <Link href="/terms" className="font-medium text-primary hover:underline">terms</Link>{" "}
            and{" "}
            <Link href="/privacy" className="font-medium text-primary hover:underline">privacy policy</Link>.
          </p>
        )}
      </div>
    </div>
  );
}
