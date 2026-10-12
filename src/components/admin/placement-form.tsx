"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { allowedNextPlacementStatusesUI } from "./statuses";

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
  const field = "mt-1 w-full rounded border px-3 py-2";
  const v = (k: keyof Initial): string => String(initial?.[k] ?? "");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
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
      router.push(`/admin/placements/${data.id ?? initial?.id}/edit`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
      setBusy(false);
    }
  }

  async function transition(to: string) {
    if (!initial?.id) return;
    if (!window.confirm(`Move placement to ${to}?`)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/placements/${initial.id}/transition`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ to }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Transition failed.");
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
    <div className="max-w-3xl space-y-4">
      <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2">
        {!initial?.id && (
          <>
            <label className="text-sm"><span className="font-medium">Student user ID *</span>
              <input name="studentUserId" required defaultValue={v("studentUserId")} placeholder="UUID from student record" className={field} /></label>
            <label className="text-sm"><span className="font-medium">Application ID (optional)</span>
              <input name="applicationId" defaultValue={v("applicationId")} placeholder="Link to application" className={field} /></label>
          </>
        )}
        <label className="text-sm"><span className="font-medium">Organization *</span>
          <input name="organization" required defaultValue={v("organization")} className={field} /></label>
        <label className="text-sm"><span className="font-medium">Role *</span>
          <input name="role" required defaultValue={v("role")} className={field} /></label>
        <label className="text-sm"><span className="font-medium">Country code *</span>
          <input name="countryCode" required minLength={2} maxLength={2} defaultValue={v("countryCode")} className={field} /></label>
        <label className="text-sm"><span className="font-medium">Start date</span>
          <input name="startDate" type="date" defaultValue={v("startDate")} className={field} /></label>
        <label className="text-sm"><span className="font-medium">End date</span>
          <input name="endDate" type="date" defaultValue={v("endDate")} className={field} /></label>
        <label className="text-sm md:col-span-2"><span className="font-medium">Notes</span>
          <textarea name="notes" rows={3} defaultValue={v("notes")} className={field} /></label>
        <div className="md:col-span-2">
          <button disabled={busy} className="rounded-lg bg-emerald-700 px-5 py-2.5 font-medium text-white hover:bg-emerald-800 disabled:opacity-50">
            {busy ? "Saving…" : initial?.id ? "Save placement" : "Create placement (Preparing)"}
          </button>
        </div>
      </form>
      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
      {initial?.id && (
        <div className="rounded-xl border p-4">
          <p className="text-sm font-semibold">Status: {initial.placementStatus}</p>
          {next.length === 0 ? (
            <p className="mt-1 text-sm text-slate-500">Terminal state — no further transitions without an approved override.</p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-2">
              {next.map((s) => (
                <button key={s} disabled={busy} onClick={() => transition(s)} className="rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-50">
                  Move to {s}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
