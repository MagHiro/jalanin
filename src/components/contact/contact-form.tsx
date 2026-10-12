"use client";

import { useState } from "react";
import Script from "next/script";

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
      <div role="status" className="alert alert-success !p-6">
        <p className="font-semibold">Message received.</p>
        <p className="mt-1 text-sm">Thank you — our team will get back to you by email.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" aria-label="Contact Jalanin">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="field-label">
          <span>Name *</span>
          <input name="name" required maxLength={120} className="field" autoComplete="name" placeholder="Your name" />
        </label>
        <label className="field-label">
          <span>Email *</span>
          <input name="email" type="email" required maxLength={320} className="field" autoComplete="email" placeholder="you@example.com" />
        </label>
      </div>
      <label className="field-label">
        <span>Subject <span className="font-normal text-muted-foreground">(optional)</span></span>
        <input name="subject" maxLength={200} className="field" placeholder="What is this about?" />
      </label>
      <label className="field-label">
        <span>Message *</span>
        <textarea name="message" required maxLength={5000} rows={5} className="field" placeholder="How can we help?" />
      </label>
      {siteKey ? (
        <div
          className="cf-turnstile"
          data-sitekey={siteKey}
          data-theme="light"
        />
      ) : null}
      {state === "error" && error && (
        <p role="alert" className="alert alert-error">{error}</p>
      )}
      <button
        type="submit"
        disabled={state === "sending"}
        className="btn btn-primary w-full sm:w-auto"
      >
        {state === "sending" ? "Sending…" : "Send message"}
      </button>
      {siteKey ? (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          strategy="afterInteractive"
        />
      ) : null}
    </form>
  );
}
