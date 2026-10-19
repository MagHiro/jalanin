"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

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
  const [reason, setReason] = useState("");
  const [pendingTarget, setPendingTarget] = useState<string | null>(null);

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
          ...extra,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Transition failed.");
      setPendingTarget(null);
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
      const res = await fetch(`/api/admin/applications/${applicationId}/acknowledge`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ expectedRevision: revision }),
      });
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
    return <p className="text-sm text-muted-foreground">No further transitions from {currentStatus} under the approved workflow.</p>;
  }

  return (
    <div className="space-y-4">
      <label className="field-label">
        <span>Reason / note <span className="font-normal text-muted-foreground">(audited)</span></span>
        <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Optional reason recorded in audit" className="field" />
      </label>
      {error && <p role="alert" className="alert alert-error">{error}</p>}
      <div className="flex flex-wrap gap-2">
        {allowed.map((target) => (
          <button
            key={target}
            disabled={busy !== null}
            onClick={() => {
              if (["Rejected", "Completed"].includes(target)) {
                setPendingTarget(target);
                return;
              }
              act(target);
            }}
            className="btn btn-primary btn-sm"
          >
            {busy === target ? "Working…" : `Move to ${target}`}
          </button>
        ))}
        <button disabled={busy !== null} onClick={acknowledge} className="btn btn-outline btn-sm">
          {busy === "ack" ? "Working…" : "Acknowledge latest revision"}
        </button>
      </div>
      <ConfirmDialog
        open={pendingTarget !== null}
        title={`Move application to ${pendingTarget ?? ""}?`}
        body="This is recorded in the audit trail and a notification is queued for the student."
        confirmLabel={`Move to ${pendingTarget ?? ""}`}
        tone="danger"
        busy={busy !== null}
        onClose={() => setPendingTarget(null)}
        onConfirm={() => pendingTarget && act(pendingTarget)}
      />
    </div>
  );
}
