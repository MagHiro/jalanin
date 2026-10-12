"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      className="inline-flex min-h-10 items-center rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
      onClick={async () => {
        setBusy(true);
        try {
          await createSupabaseBrowserClient().auth.signOut();
        } catch {
          // Fall through to a hard navigation even if sign-out fails.
        }
        window.location.href = "/";
      }}
    >
      {busy ? "Logging out…" : "Log out"}
    </button>
  );
}
