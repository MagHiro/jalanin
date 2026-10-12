"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function ReopenControl({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  async function reopen() {
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
      setConfirming(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reopen failed.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <label className="field-label">
        <span>Reopen reason * <span className="font-normal text-muted-foreground">(audited)</span></span>
        <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why is this being reopened?" className="field" />
      </label>
      {error && <p role="alert" className="alert alert-error">{error}</p>}
      <button
        disabled={busy}
        onClick={() => {
          if (!reason.trim()) {
            setError("A reopen reason is required (audited).");
            return;
          }
          setConfirming(true);
        }}
        className="btn btn-sm bg-warning text-white hover:brightness-95 disabled:opacity-50"
      >
        {busy ? "Working…" : "Reopen into In Review (admin only)"}
      </button>
      <ConfirmDialog
        open={confirming}
        title="Reopen this rejected application?"
        body="It returns to In Review as the same record, and the student can edit again per policy."
        confirmLabel="Reopen into In Review"
        busy={busy}
        onClose={() => setConfirming(false)}
        onConfirm={reopen}
      />
    </div>
  );
}
