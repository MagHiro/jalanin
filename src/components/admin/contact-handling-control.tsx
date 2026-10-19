"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Per-enquiry Open / Handled toggle (A3). Admin-only endpoint; audited. */
export function ContactHandlingControl({
  contactId,
  handled,
}: {
  contactId: string;
  handled: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/contacts/${contactId}/handling`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ handled: !handled }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Update failed.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="crm-handling-control">
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        className="crm-row-link"
        aria-label={handled ? "Reopen this enquiry" : "Mark this enquiry as handled"}
      >
        {busy ? "Saving…" : handled ? "Reopen" : "Mark as handled"}
      </button>
      {error && <span role="alert" className="crm-handling-error">{error}</span>}
    </span>
  );
}
