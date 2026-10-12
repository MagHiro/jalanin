"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function TransitionControls({
  applicationId,
  currentStatus,
  allowed,
  revision,
}: {
  applicationId: string;
  currentStatus: string;
  allowed: string[];
  revision: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState({ amount: "", notesStudent: "", notesInternal: "" });
  const [reason, setReason] = useState("");
  const needsQuote = (target: string) => target === "Quotation Sent";

  async function act(target: string, extra: Record<string, unknown> = {}) {
    setBusy(target);
    setError(null);
    try {
      const res = await fetch(`/api/admin/applications/${applicationId}/transition`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          to: target,
          reason: reason || undefined,
          expectedRevision: revision,
          quotation: needsQuote(target) ? quote : undefined,
          ...extra,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Transition failed.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transition failed.");
    } finally {
      setBusy(null);
    }
  }

  async function acknowledge() {
    setBusy("ack");
    setError(null);
    try {
      const res = await fetch(`/api/admin/applications/${applicationId}/acknowledge`, { method: "POST" });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Acknowledgement failed.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Acknowledgement failed.");
    } finally {
      setBusy(null);
    }
  }

  if (allowed.length === 0) {
    return <p className="text-sm text-slate-500">No further transitions from {currentStatus} under the approved workflow.</p>;
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm">
        <span className="font-medium">Reason / note (audited)</span>
        <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Optional reason recorded in audit" className="mt-1 w-full rounded border px-3 py-2" />
      </label>
      {allowed.some(needsQuote) && (
        <fieldset className="rounded-xl border p-3 text-sm">
          <legend className="px-1 font-semibold">Quotation (SGD only)</legend>
          <label className="block"><span className="font-medium">Amount (SGD) *</span>
            <input value={quote.amount} onChange={(e) => setQuote({ ...quote, amount: e.target.value })} placeholder="e.g. 1250.50" inputMode="decimal" className="mt-1 w-full rounded border px-3 py-2" /></label>
          <label className="mt-2 block"><span className="font-medium">Student-facing terms * (sent by email)</span>
            <textarea value={quote.notesStudent} onChange={(e) => setQuote({ ...quote, notesStudent: e.target.value })} rows={3} className="mt-1 w-full rounded border px-3 py-2" /></label>
          <label className="mt-2 block"><span className="font-medium">Internal notes (never emailed)</span>
            <textarea value={quote.notesInternal} onChange={(e) => setQuote({ ...quote, notesInternal: e.target.value })} rows={2} className="mt-1 w-full rounded border px-3 py-2" /></label>
        </fieldset>
      )}
      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
      <div className="flex flex-wrap gap-2">
        {allowed.map((target) => (
          <button
            key={target}
            disabled={busy !== null}
            onClick={() => {
              if (["Rejected", "Completed"].includes(target)) {
                if (!window.confirm(`Move application to ${target}? This is recorded and emailed.`)) return;
              }
              act(target);
            }}
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
          >
            {busy === target ? "Working…" : `Move to ${target}`}
          </button>
        ))}
        <button disabled={busy !== null} onClick={acknowledge} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50">
          {busy === "ack" ? "Working…" : "Acknowledge latest revision"}
        </button>
      </div>
    </div>
  );
}
