"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function AuthForm({ mode }: { mode: "login" | "sign-up" }) {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const next = params.get("next") ?? "/dashboard";

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
      // E2E/dev seam: mirror the session into a signed cookie when requested.
      if (process.env.NEXT_PUBLIC_E2E === "1" || window.location.hostname === "localhost") {
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
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-bold">
        {mode === "login" ? "Log in" : "Create your account"}
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        {mode === "login" ? (
          <>New to Jalanin? <Link href="/auth/sign-up" className="text-emerald-700 hover:underline">Sign up</Link></>
        ) : (
          <>Already have an account? <Link href="/auth/login" className="text-emerald-700 hover:underline">Log in</Link></>
        )}
      </p>
      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <label className="block text-sm">
          <span className="font-medium">Email</span>
          <input name="email" type="email" required autoComplete="email" className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <label className="block text-sm">
          <span className="font-medium">Password {mode === "sign-up" && "(min. 8 characters)"}</span>
          <input name="password" type="password" required minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
        <button type="submit" disabled={busy} className="w-full rounded-lg bg-emerald-700 px-5 py-2.5 font-medium text-white hover:bg-emerald-800 disabled:opacity-50">
          {busy ? "Please wait…" : mode === "login" ? "Log in" : "Sign up"}
        </button>
      </form>
      {mode === "login" && (
        <p className="mt-3 text-sm">
          <Link href="/auth/forgot-password" className="text-emerald-700 hover:underline">Forgot your password?</Link>
        </p>
      )}
    </div>
  );
}
