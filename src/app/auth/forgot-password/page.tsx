"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    setError(null);
    const email = String(new FormData(e.currentTarget).get("email") ?? "");
    try {
      const { error } = await createSupabaseBrowserClient().auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) throw new Error(error.message);
      setState("sent");
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Request failed.");
    }
  }

  if (state === "sent") {
    return (
      <div className="mx-auto max-w-md" role="status">
        <h1 className="text-2xl font-bold">Check your email</h1>
        <p className="mt-2 text-sm text-slate-600">
          If an account exists for that address, a time-limited reset link is on its way.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-bold">Forgot your password?</h1>
      <p className="mt-1 text-sm text-slate-600">Enter your account email to receive a reset link.</p>
      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <label className="block text-sm">
          <span className="font-medium">Email</span>
          <input name="email" type="email" required autoComplete="email" className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        {state === "error" && error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
        <button type="submit" disabled={state === "sending"} className="w-full rounded-lg bg-emerald-700 px-5 py-2.5 font-medium text-white hover:bg-emerald-800 disabled:opacity-50">
          {state === "sending" ? "Sending…" : "Send reset link"}
        </button>
      </form>
    </div>
  );
}
