"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Reveal } from "@/components/motion/reveal";

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
 * Grouped single-page layout; approved fields only — no new required fields.
 */
export function ApplicationForm({ internshipId, existing }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<"draft" | "submit" | null>(null);
  const inFlight = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [cvName, setCvName] = useState<string | null>(null);
  const [cvSize, setCvSize] = useState<string | null>(null);

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
      graduationYear: base.get("graduationYear") === "" ? undefined : Number(base.get("graduationYear")),
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
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    if (!res.ok || !data.ok) throw new Error(data.error ?? "CV upload failed.");
  }

  async function onAction(kind: "draft" | "submit", e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (inFlight.current || locked) return;
    inFlight.current = true;
    setBusy(kind);
    setError(null);
    try {
      const form = new FormData(e.currentTarget);
      const values = await collect(form);
      const file = form.get("cv");
      const cvFile = file instanceof File && file.size > 0 ? file : null;
      if (cvFile && cvFile.size > 5 * 1024 * 1024) {
        throw new Error("CV exceeds the 5 MB upload limit.");
      }
      if (cvFile && !/\\.(pdf|docx)$/i.test(cvFile.name)) {
        throw new Error("Please upload a PDF or DOCX CV.");
      }

      // A submitted record is *not* a draft: do not call the draft-only API.
      // Its updates go through the audited revision endpoint below.
      const isRevision = existing !== null && !existing.isDraft;
      if (isRevision && kind === "draft") {
        throw new Error("Submitted applications cannot be saved as drafts.");
      }
      let applicationId = isRevision ? existing.id : "";
      if (!isRevision) {
        const draftRes = await fetch("/api/applications/draft", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ internshipId, values }),
        });
        const draft = (await draftRes.json().catch(() => ({}))) as {
          ok?: boolean;
          applicationId?: string;
          error?: string;
        };
        if (!draftRes.ok || !draft.ok || !draft.applicationId) {
          throw new Error(draft.error ?? "Could not save draft.");
        }
        applicationId = draft.applicationId;
      }
      // Uploading a replacement CV on a submitted application also creates
      // a re-review revision on the server, independently of text changes.
      await uploadCv(applicationId, cvFile);

      if (kind === "submit") {
        // 3. Atomic final submit (idempotency key defeats double-clicks).
        const key = `${applicationId}:${Date.now()}`;
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
        const sub = (await subRes.json().catch(() => ({}))) as { ok?: boolean; ref?: string; error?: string };
        if (!subRes.ok || !sub.ok) throw new Error(sub.error ?? "Submission failed.");
        router.push(`/dashboard/applications/${applicationId}?submitted=1`);
        router.refresh();
        return;
      }
      router.push(`/dashboard/applications?draft=1`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(null);
      inFlight.current = false;
    }
  }

  function onCvChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) {
      setCvName(null);
      setCvSize(null);
      return;
    }
    setCvName(f.name);
    setCvSize(f.size > 1024 * 1024 ? `${(f.size / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(f.size / 1024))} KB`);
  }

  const step = (n: string, label: string) => (
    <span className="flex items-center gap-2.5">
      <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-full bg-secondary text-xs font-bold text-primary">{n}</span>
      <span className="font-semibold text-foreground">{label}</span>
    </span>
  );

  return (
    <Reveal stagger={0.05}>
    <form
      onSubmit={(e) => onAction("submit", e)}
      className="space-y-5"
      aria-label="Internship application"
    >
      {locked && (
        <div role="note" className="alert alert-warning">
          <p className="font-semibold">This application is locked for editing.</p>
          <p className="mt-1">Status is {String(existing?.lifecycleStatus)}. Editing locks once a quotation is sent — contact us if you need changes.</p>
        </div>
      )}
      {!locked && existing && !existing.isDraft && (
        <div role="note" className="alert alert-info">
          You are editing a <b>{String(existing.lifecycleStatus)}</b> application (revision {String(existing.revision ?? 1)}).
          Saving will require admin re-review before the application can progress.
        </div>
      )}
      <fieldset disabled={locked || busy !== null} className="space-y-5">
        <section data-reveal aria-labelledby="personal" className="form-section">
          <h2 id="personal">{step("1", "Personal information")}</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="field-label"><span>First name *</span>
              <input name="firstName" required defaultValue={get("firstName")} className="field" autoComplete="given-name" placeholder="Amina" /></label>
            <label className="field-label"><span>Last name *</span>
              <input name="lastName" required defaultValue={get("lastName")} className="field" autoComplete="family-name" placeholder="Rahman" /></label>
            <label className="field-label"><span>Email *</span>
              <input name="email" type="email" required defaultValue={get("email")} className="field" autoComplete="email" placeholder="you@example.com" /></label>
            <label className="field-label"><span>Nationality *</span>
              <input name="nationality" required defaultValue={get("nationality")} className="field" autoComplete="country-name" placeholder="Indonesian" /></label>
          </div>
        </section>

        <section data-reveal aria-labelledby="education" className="form-section">
          <h2 id="education">{step("2", "Education")}</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="field-label"><span>University *</span>
              <input name="university" required defaultValue={get("university")} className="field" placeholder="Universitas Indonesia" /></label>
            <label className="field-label"><span>Course / program *</span>
              <input name="course" required defaultValue={get("course")} className="field" placeholder="Hospitality Management" /></label>
            <label className="field-label"><span>Graduation year *</span>
              <input name="graduationYear" type="number" required min={1950} max={2100} defaultValue={get("graduationYear")} className="field" placeholder="2026" /></label>
            <div className="grid grid-cols-2 gap-4">
              <label className="field-label"><span>Preferred start *</span>
                <input name="preferredStart" type="date" required defaultValue={get("preferredStart")} className="field" /></label>
              <label className="field-label"><span>Preferred end *</span>
                <input name="preferredEnd" type="date" required defaultValue={get("preferredEnd")} className="field" /></label>
            </div>
          </div>
        </section>

        <section data-reveal aria-labelledby="documents" className="form-section">
          <h2 id="documents">{step("3", "Documents")}</h2>
          <label className="field-label mt-4" htmlFor="cv-upload">
            <span>CV (PDF or DOCX, max 5 MB) *</span>
          </label>
          <div className="mt-1 rounded-xl border border-dashed border-border bg-background p-4">
            <input
              id="cv-upload"
              name="cv"
              type="file"
              accept=".pdf,.docx"
              onChange={onCvChange}
              className="w-full text-sm text-foreground file:mr-3 file:rounded-lg file:border file:border-border file:bg-surface file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-secondary"
            />
            {cvName ? (
              <p role="status" className="mt-2 text-sm text-foreground">
                <span aria-hidden="true">📄 </span>Selected: <b>{cvName}</b>{cvSize && <span className="text-muted-foreground"> · {cvSize}</span>}
              </p>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">Private upload — only authorized Jalanin administrators can download your CV.</p>
            )}
          </div>
        </section>

        <section data-reveal aria-labelledby="notes" className="form-section">
          <h2 id="notes">{step("4", "Additional information")}</h2>
          <label className="field-label mt-4">
            <span>Anything else we should know? <span className="font-normal text-muted-foreground">(optional)</span></span>
            <textarea name="additionalInformation" rows={4} maxLength={5000} defaultValue={get("additionalInformation")} className="field" placeholder="Availability notes, motivation, relevant experience…" />
          </label>
        </section>

        <section data-reveal aria-labelledby="consent" className="form-section consent-panel">
          <h2 id="consent">{step("5", "Consent & review")}</h2>
          <div className="mt-4 space-y-3 text-sm">
            <label className="flex gap-3">
              <input type="checkbox" name="consentPrivacy" defaultChecked={Boolean(existing && !existing.isDraft)} required className="mt-1 size-4 shrink-0 accent-primary" />
              <span>I consent to the processing of my personal data under the <a href="/privacy" className="font-medium text-primary hover:underline" target="_blank" rel="noreferrer">privacy policy</a>. *</span>
            </label>
            <label className="flex gap-3">
              <input type="checkbox" name="consentTerms" defaultChecked={Boolean(existing && !existing.isDraft)} required className="mt-1 size-4 shrink-0 accent-primary" />
              <span>I agree to the <a href="/terms" className="font-medium text-primary hover:underline" target="_blank" rel="noreferrer">terms of service</a>. *</span>
            </label>
          </div>
        </section>
      </fieldset>

      {error && <p role="alert" className="alert alert-error">{error}</p>}

      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        {(!existing || existing.isDraft) && <button
          type="button"
          disabled={locked || busy !== null}
          onClick={(e) => {
            const form = (e.target as HTMLElement).closest("form");
            if (form) onAction("draft", { preventDefault: () => undefined, currentTarget: form } as unknown as React.FormEvent<HTMLFormElement>);
          }}
          className="btn btn-outline flex-1"
        >
          {busy === "draft" ? "Saving…" : "Save draft"}
        </button>}
        <button
          type="submit"
          disabled={locked || busy !== null}
          className="btn btn-primary flex-1"
        >
          {busy === "submit" ? "Submitting…" : existing && !existing.isDraft ? "Save changes" : "Submit application"}
        </button>
      </div>
      <p className="text-center text-xs leading-5 text-muted-foreground">
        {existing && !existing.isDraft ? "Changes to a submitted application require admin re-review." : "Drafts save explicitly and resume after logout. Nothing is sent until you submit."}
      </p>
    </form>
    </Reveal>
  );
}
