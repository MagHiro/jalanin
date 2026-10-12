import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Supabase Auth callback: exchanges the email-verification / recovery code
// for a session, then returns to the requested in-app destination.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/dashboard";
  // A path beginning with "//" is a protocol-relative external URL.
  // Require an internal relative path and disallow backslashes/control chars.
  const safeNext =
    next.startsWith("/") &&
    !next.startsWith("//") &&
    !/[\\\\\u0000-\u001f]/.test(next)
      ? next
      : "/dashboard";
  if (code) {
    const supabase = createSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);
  }
  redirect(safeNext);
}
