import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// Browser-safe Supabase client for user-scoped reads (RLS enforced).
// Server Components that need the session user use this; all privileged
// writes go through src/lib/db/client.ts after requireStudent/requireAdmin.
export function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not configured.",
    );
  }
  const cookieStore = cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        try {
          toSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component without mutable cookies — safe to ignore.
        }
      },
    },
  });
}

// Test/E2E seam: when E2E_MODE=1 and no Supabase is configured, routes fall
// back to the local privileged client with explicit dev-session headers.
// Production builds never enable this (see src/lib/auth/require.ts).
export function isE2EMode(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.E2E_MODE === "1";
}
