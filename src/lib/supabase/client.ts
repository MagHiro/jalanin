"use client";

import { createBrowserClient } from "@supabase/ssr";

// Browser Supabase client (anon key only — RLS enforced). Used by auth forms
// and sign-out. Never handles service-role keys or privileged access.
export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Supabase is not configured for this environment.");
  }
  return createBrowserClient(url, anonKey);
}
