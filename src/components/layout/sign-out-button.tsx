"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <button
        type="button"
        disabled={busy}
        className="inline-flex min-h-10 items-center rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
        onClick={async () => {
          if (busy) return;
          setBusy(true);
          setError(null);
          try {
            const { error: signOutError } = await createSupabaseBrowserClient().auth.signOut();
            if (signOutError) throw signOutError;
            window.location.assign("/");
          } catch {
            // Never claim sign-out succeeded while the session remains active.
            setError("Could not log out. Please try again.");
            setBusy(false);
          }
        }}
      >
        {busy ? "Logging out…" : "Log out"}
      </button>
      {error && <p role="alert" className="mt-1 max-w-48 text-xs text-error">{error}</p>}
    </div>
  );
}
