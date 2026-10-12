"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Check, Compass } from "lucide-react";

// Centered auth card (PayPal/Krea-inspired, email+password per PRD AUTH-*).
// E2E asserts: heading "Log in", labelled email/password inputs, submit
// button named "Log in" — preserved verbatim.
export function AuthForm({ mode }: { mode: "login" | "sign-up" }) {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const requestedNext = params.get("next") ?? "/dashboard";
  // Reject protocol-relative or backslash redirects. This value is used by
  // both the browser router and the email verification callback.
  const next =
    requestedNext.startsWith("/") &&
    !requestedNext.startsWith("//") &&
    !requestedNext.includes("\\")
      ? requestedNext
      : "/dashboard";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    try {
      const supabase = createSupabaseBrowserClient();
      const result =
        mode === "login"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({
              email,
              password,
              options: {
                emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
              },
            });
      if (result.error) throw new Error(result.error.message);
      // E2E/dev seam: mirror the session into a signed test cookie ONLY when
      // explicitly enabled (NEXT_PUBLIC_E2E=1, local/CI runs). The endpoint
      // itself 404s unless E2E_MODE=1 server-side, so this is doubly gated.
      if (process.env.NEXT_PUBLIC_E2E === "1") {
        try {
          await fetch("/api/dev/session", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ userId: result.data.user?.id ?? result.data.session?.user.id }),
          });
        } catch {
          // Non-fatal: Supabase cookies remain the primary session.
        }
      }
      router.push(next.startsWith("/") ? next : "/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
      setBusy(false);
    }
  }

  return (
    <div className="auth-layout mx-auto max-w-5xl">
        <div className="auth-story">
          <Compass size={42} strokeWidth={1.2} className="text-primary" aria-hidden="true" />
          <p className="eyebrow mt-8">Your next chapter</p>
          <h2 className="section-title mt-4">A world of possibilities.<br />A place to begin.</h2>
          <p className="mt-5 max-w-md leading-7 text-muted-foreground">Build your experience beyond the classroom, with personal guidance at every step.</p>
          <ul className="mt-4 space-y-4 text-sm leading-6">
            {[
              ["Save drafts as you go", "Start an application and resume any time — nothing is sent until you submit."],
              ["Track every status", "See Draft, Submitted, In Review and quotation updates in your dashboard."],
              ["Quotations by email", "A custom quotation arrives after review. Reply to accept — no hidden fees."],
            ].map(([t, b]) => (
              <li key={t} className="flex gap-3">
                <Check aria-hidden="true" size={18} className="mt-1 shrink-0 text-primary" />
                <span><b className="block font-medium text-foreground">{t}</b><span className="text-muted-foreground">{b}</span></span>
              </li>
            ))}
          </ul>
        </div>
      <div className="px-2 py-6 md:px-8">
        <p className="eyebrow">Jalanin student account</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
          {mode === "login" ? "Log in" : "Create your account"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "login" ? (
            <>New to Jalanin? <Link href={next !== "/dashboard" ? `/auth/sign-up?next=${encodeURIComponent(next)}` : "/auth/sign-up"} className="font-semibold text-primary hover:underline">Sign up</Link></>
          ) : (
            <>Already have an account? <Link href={next !== "/dashboard" ? `/auth/login?next=${encodeURIComponent(next)}` : "/auth/login"} className="font-semibold text-primary hover:underline">Log in</Link></>
          )}
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate={false}>
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
        </form>
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
