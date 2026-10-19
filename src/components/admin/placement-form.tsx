"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { allowedNextPlacementStatusesUI } from "./statuses";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DateInput } from "@/components/ui/date-input";

interface Initial {
  id?: string;
  studentUserId?: string;
  applicationId?: string | null;
  organization?: string;
  role?: string;
  countryCode?: string;
  startDate?: string | null;
  endDate?: string | null;
  notes?: string | null;
  placementStatus?: string;
}

export function PlacementForm({ initial }: { initial?: Initial }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const v = (k: keyof Initial): string => String(initial?.[k] ?? "");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);
    const form = new FormData(e.currentTarget);
    const payload = {
      studentUserId: form.get("studentUserId"),
      applicationId: (form.get("applicationId") as string) || null,
      organization: form.get("organization"),
      role: form.get("role"),
      countryCode: form.get("countryCode"),
      startDate: (form.get("startDate") as string) || null,
      endDate: (form.get("endDate") as string) || null,
      notes: (form.get("notes") as string) || null,
    };
    try {
      const res = await fetch(
        initial?.id ? `/api/admin/placements/${initial.id}` : "/api/admin/placements",
        {
          method: initial?.id ? "PUT" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = (await res.json()) as { ok?: boolean; id?: string; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Save failed.");
      setSuccess(initial?.id ? "Placement saved." : "Placement created.");
      if (!initial?.id) router.push(`/admin/placements/${data.id}/edit?created=1`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  async function transition(to: string) {
    if (!initial?.id) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/admin/placements/${initial.id}/transition`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ to }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Transition failed.");
      setPendingStatus(null);
      setSuccess(`Placement moved to ${to}.`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transition failed.");
    } finally {
      setBusy(false);
    }
  }

  const next = initial?.placementStatus
    ? allowedNextPlacementStatusesUI(initial.placementStatus)
    : [];

  return (
    <div className="max-w-3xl space-y-5">
      <form onSubmit={onSubmit} aria-label={initial?.id ? "Edit placement" : "New placement"} className="form-section">
        <div className="grid gap-4 md:grid-cols-2">
          {!initial?.id && (
            <>
              <label className="field-label"><span>Student user ID *</span>
                <input name="studentUserId" required defaultValue={v("studentUserId")} placeholder="UUID from student record" className="field font-mono text-[13px]" /></label>
              <label className="field-label"><span>Application ID <span className="font-normal text-muted-foreground">(optional)</span></span>
                <input name="applicationId" defaultValue={v("applicationId")} placeholder="Link to application" className="field font-mono text-[13px]" /></label>
            </>
          )}
          <label className="field-label"><span>Organization *</span>
            <input name="organization" required defaultValue={v("organization")} className="field" placeholder="Marina Hotel" /></label>
          <label className="field-label"><span>Role *</span>
            <input name="role" required defaultValue={v("role")} className="field" placeholder="Front Office Intern" /></label>
          <label className="field-label"><span>Country code *</span>
            <input name="countryCode" required minLength={2} maxLength={2} defaultValue={v("countryCode")} className="field" placeholder="SG" /></label>
          <label className="field-label"><span>Start date</span>
            <DateInput name="startDate" ariaLabel="Start date" defaultValue={v("startDate")} /></label>
          <label className="field-label"><span>End date</span>
            <DateInput name="endDate" ariaLabel="End date" defaultValue={v("endDate")} /></label>
          <label className="field-label md:col-span-2"><span>Notes <span className="font-normal text-muted-foreground">(visible to the student)</span></span>
            <textarea name="notes" rows={3} defaultValue={v("notes")} className="field" /></label>
          <div className="md:col-span-2 workspace-editor-submit">
            <div><strong>{initial?.id ? "Placement details" : "Create placement"}</strong><span>Changes are recorded in the placement workspace.</span></div>
            <div className="workspace-editor-submit-actions">
              <Link href="/admin/placements" className="btn btn-outline">Cancel</Link>
              <button type="submit" disabled={busy} className="btn btn-primary">
                {busy ? "Saving…" : initial?.id ? "Save changes" : "Create placement"}
              </button>
            </div>
          </div>
        </div>
      </form>
      {error && <p role="alert" className="alert alert-error">{error}</p>}
      {success && <p role="status" className="alert alert-success">{success}</p>}
      {initial?.id && (
        <div className="surface-card p-5">
          <p className="text-sm font-semibold text-foreground">Status: {initial.placementStatus}</p>
          {next.length === 0 ? (
            <p className="mt-1 text-sm text-muted-foreground">Terminal state — no further transitions without an approved override.</p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {next.map((s) => (
                <button key={s} disabled={busy} onClick={() => setPendingStatus(s)} className="btn btn-outline btn-sm">
                  Move to {s}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <ConfirmDialog
        open={pendingStatus !== null}
        title={`Move placement to ${pendingStatus ?? ""}?`}
        body="The student sees the updated placement status in their dashboard."
        confirmLabel={`Move to ${pendingStatus ?? ""}`}
        busy={busy}
        onClose={() => setPendingStatus(null)}
        onConfirm={() => pendingStatus && transition(pendingStatus)}
      />
    </div>
  );
}
