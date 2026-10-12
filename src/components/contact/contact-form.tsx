"use client";

import { useState } from "react";

export function ContactForm() {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    setError(null);
    const form = new FormData(e.currentTarget);
    // Turnstile widget token: rendered by the widget script when configured.
    const token =
      (document.querySelector<HTMLInputElement>('input[name="cf-turnstile-response"]')?.value) ||
      (form.get("turnstileToken") as string) ||
      "";
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          subject: form.get("subject"),
          message: form.get("message"),
          turnstileToken: token || "dev-bypass-missing-widget",
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Submission failed.");
      setState("sent");
      e.currentTarget.reset();
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Submission failed.");
    }
  }

  if (state === "sent") {
    return (
      <div role="status" className="rounded-xl border border-emerald-300 bg-emerald-50 p-6">
        <p className="font-semibold text-emerald-800">Message received.</p>
        <p className="mt-1 text-sm text-emerald-900">Thank you — our team will get back to you by email.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium">Name *</span>
          <input name="name" required maxLength={120} className="mt-1 w-full rounded border px-3 py-2" autoComplete="name" />
        </label>
        <label className="block text-sm">
          <span className="font-medium">Email *</span>
          <input name="email" type="email" required maxLength={320} className="mt-1 w-full rounded border px-3 py-2" autoComplete="email" />
        </label>
      </div>
      <label className="block text-sm">
        <span className="font-medium">Subject</span>
        <input name="subject" maxLength={200} className="mt-1 w-full rounded border px-3 py-2" />
      </label>
      <label className="block text-sm">
        <span className="font-medium">Message *</span>
        <textarea name="message" required maxLength={5000} rows={5} className="mt-1 w-full rounded border px-3 py-2" />
      </label>
      {siteKey ? (
        <div
          className="cf-turnstile"
          data-sitekey={siteKey}
          data-theme="light"
        />
      ) : null}
      {state === "error" && error && (
        <p role="alert" className="text-sm text-rose-700">{error}</p>
      )}
      <button
        type="submit"
        disabled={state === "sending"}
        className="rounded-lg bg-emerald-700 px-5 py-2.5 font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
      >
        {state === "sending" ? "Sending…" : "Send message"}
      </button>
      <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
    </form>
  );
}
