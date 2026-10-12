"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      className="px-2 py-1.5 text-slate-600 hover:text-rose-700 disabled:opacity-50"
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
      Log out
    </button>
  );
}
