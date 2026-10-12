"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  internshipId: string;
  existing: {
    id: string;
    isDraft: boolean;
    lifecycleStatus: string;
    [key: string]: unknown;
  } | null;
}

/**
 * Application form: Save Draft (persistent, resumable) + Submit (atomic,
 * idempotent). Drafts save explicitly per PRD (autosave undecided, B-caveat).
 */
export function ApplicationForm({ internshipId, existing }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<"draft" | "submit" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cvName, setCvName] = useState<string | null>(null);

  const get = (k: string): string => {
    const v = existing?.[k];
    return typeof v === "string" || typeof v === "number" ? String(v) : "";
  };
  const locked =
    existing !== null &&
    !existing.isDraft &&
    !["New", "In Review"].includes(String(existing.lifecycleStatus));

  async function collect(base: FormData): Promise<Record<string, unknown>> {
    return {
      firstName: base.get("firstName"),
      lastName: base.get("lastName"),
      email: base.get("email"),
      nationality: base.get("nationality"),
      university: base.get("university"),
      course: base.get("course"),
      graduationYear: Number(base.get("graduationYear")),
      preferredStart: base.get("preferredStart"),
      preferredEnd: base.get("preferredEnd"),
      additionalInformation: base.get("additionalInformation") ?? "",
      consentPrivacy: base.get("consentPrivacy") === "on",
      consentTerms: base.get("consentTerms") === "on",
    };
  }

  async function uploadCv(applicationId: string, file: File | null): Promise<void> {
    if (!file || file.size === 0) return;
    const form = new FormData();
    form.set("applicationId", applicationId);
    form.set("file", file);
    const res = await fetch("/api/documents/upload", { method: "POST", body: form });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok || !data.ok) throw new Error(data.error ?? "CV upload failed.");
  }

  async function onAction(kind: "draft" | "submit", e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(kind);
    setError(null);
    try {
      const form = new FormData(e.currentTarget);
      const values = await collect(form);
      const file = form.get("cv");
      const cvFile = file instanceof File && file.size > 0 ? file : null;

      // 1. Persist the draft (creates or resumes the single row).
      const draftRes = await fetch("/api/applications/draft", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ internshipId, values }),
      });
      const draft = (await draftRes.json()) as {
        ok?: boolean;
        applicationId?: string;
        error?: string;
      };
      if (!draftRes.ok || !draft.ok || !draft.applicationId) {
        throw new Error(draft.error ?? "Could not save draft.");
      }
      // 2. Upload/replace the CV (allowed pre-lock).
      await uploadCv(draft.applicationId, cvFile);

      if (kind === "submit") {
        // 3. Atomic final submit (idempotency key defeats double-clicks).
        const key = `${draft.applicationId}:${Date.now()}`;
        const subRes = await fetch("/api/applications/submit", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "Idempotency-Key": key,
          },
          body: JSON.stringify({
            internshipId,
            values,
            idempotencyKey: key,
          }),
        });
        const sub = (await subRes.json()) as { ok?: boolean; ref?: string; error?: string };
        if (!subRes.ok || !sub.ok) throw new Error(sub.error ?? "Submission failed.");
        router.push(`/dashboard/applications/${draft.applicationId}?submitted=1`);
        return;
      }
      router.push(`/dashboard/applications?draft=1`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(null);
    }
  }

  const field = "mt-1 w-full rounded border px-3 py-2 disabled:bg-slate-100";

  return (
    <form
      onSubmit={(e) => onAction("submit", e)}
      className="space-y-6"
      aria-label="Internship application"
    >
      {locked && (
        <p role="note" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          This application is in status {String(existing?.lifecycleStatus)} and is
          locked for student editing.
        </p>
      )}
      <fieldset disabled={locked || busy !== null} className="space-y-6">
        <section aria-labelledby="personal">
          <h2 id="personal" className="font-semibold">Personal information</h2>
          <div className="mt-2 grid gap-3 md:grid-cols-2">
            <label className="text-sm"><span className="font-medium">First name *</span>
              <input name="firstName" required defaultValue={get("firstName")} className={field} autoComplete="given-name" /></label>
            <label className="text-sm"><span className="font-medium">Last name *</span>
              <input name="lastName" required defaultValue={get("lastName")} className={field} autoComplete="family-name" /></label>
            <label className="text-sm"><span className="font-medium">Email *</span>
              <input name="email" type="email" required defaultValue={get("email")} className={field} autoComplete="email" /></label>
            <label className="text-sm"><span className="font-medium">Nationality *</span>
              <input name="nationality" required defaultValue={get("nationality")} className={field} autoComplete="country-name" /></label>
          </div>
        </section>

        <section aria-labelledby="education">
          <h2 id="education" className="font-semibold">Education</h2>
          <div className="mt-2 grid gap-3 md:grid-cols-2">
            <label className="text-sm"><span className="font-medium">University *</span>
              <input name="university" required defaultValue={get("university")} className={field} /></label>
            <label className="text-sm"><span className="font-medium">Course / program *</span>
              <input name="course" required defaultValue={get("course")} className={field} /></label>
            <label className="text-sm"><span className="font-medium">Graduation year *</span>
              <input name="graduationYear" type="number" required min={1950} max={2100} defaultValue={get("graduationYear")} className={field} /></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm"><span className="font-medium">Preferred start *</span>
                <input name="preferredStart" type="date" required defaultValue={get("preferredStart")} className={field} /></label>
              <label className="text-sm"><span className="font-medium">Preferred end *</span>
                <input name="preferredEnd" type="date" required defaultValue={get("preferredEnd")} className={field} /></label>
            </div>
          </div>
        </section>

        <section aria-labelledby="documents">
          <h2 id="documents" className="font-semibold">Documents</h2>
          <label className="mt-2 block text-sm">
            <span className="font-medium">CV (PDF or DOCX, max 5 MB) *</span>
            <input
              name="cv"
              type="file"
              accept=".pdf,.docx"
              className="mt-1 w-full text-sm"
              onChange={(e) => setCvName(e.target.files?.[0]?.name ?? null)}
            />
            {cvName && <span className="text-xs text-slate-600">Selected: {cvName}</span>}
          </label>
        </section>

        <section aria-labelledby="notes">
          <h2 id="notes" className="font-semibold">Additional information</h2>
          <label className="mt-2 block text-sm">
            <span className="font-medium">Anything else we should know? (optional)</span>
            <textarea name="additionalInformation" rows={4} maxLength={5000} defaultValue={get("additionalInformation")} className={field} />
          </label>
        </section>

        <section aria-labelledby="consent" className="rounded-xl bg-slate-50 p-4 text-sm">
          <h2 id="consent" className="font-semibold">Consent</h2>
          <label className="mt-2 flex gap-2">
            <input type="checkbox" name="consentPrivacy" required className="mt-1" />
            <span>I consent to the processing of my personal data under the <a href="/privacy" className="text-emerald-700 hover:underline" target="_blank">privacy policy</a>. *</span>
          </label>
          <label className="mt-2 flex gap-2">
            <input type="checkbox" name="consentTerms" required className="mt-1" />
            <span>I agree to the <a href="/terms" className="text-emerald-700 hover:underline" target="_blank">terms of service</a>. *</span>
          </label>
        </section>
      </fieldset>

      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={locked || busy !== null}
          onClick={(e) => {
            const form = (e.target as HTMLElement).closest("form");
            if (form) onAction("draft", { preventDefault: () => undefined, currentTarget: form } as unknown as React.FormEvent<HTMLFormElement>);
          }}
          className="rounded-lg border px-5 py-2.5 font-medium hover:bg-slate-50 disabled:opacity-50"
        >
          {busy === "draft" ? "Saving…" : "Save draft"}
        </button>
        <button
          type="submit"
          disabled={locked || busy !== null}
          className="rounded-lg bg-emerald-700 px-5 py-2.5 font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
        >
          {busy === "submit" ? "Submitting…" : existing && !existing.isDraft ? "Save changes" : "Submit application"}
        </button>
      </div>
    </form>
  );
}
