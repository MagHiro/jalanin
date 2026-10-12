"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ReopenControl({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reopen() {
    if (!reason.trim()) {
      setError("A reopen reason is required (audited).");
      return;
    }
    if (!window.confirm("Reopen this rejected application into In Review? The student will be able to edit again per policy.")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/applications/${applicationId}/reopen`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Reopen failed.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reopen failed.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm">
        <span className="font-medium">Reopen reason * (audited)</span>
        <input value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" />
      </label>
      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
      <button disabled={busy} onClick={reopen} className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50">
        {busy ? "Working…" : "Reopen into In Review (admin only)"}
      </button>
    </div>
  );
}
