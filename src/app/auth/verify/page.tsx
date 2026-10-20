"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function VerifyForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [state, setState] = useState<"working" | "done" | "error">("working");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run(): Promise<void> {
      if (!token) {
        setState("error");
        setError("This verification link is invalid.");
        return;
      }
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
        if (cancelled) return;
        if (!res.ok || !data?.ok) throw new Error(data?.error ?? "Verification failed.");
        setState("done");
        router.refresh();
      } catch (err) {
        if (cancelled) return;
        setState("error");
        setError(err instanceof Error ? err.message : "Verification failed.");
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [token, router]);

  return (
    <div className="auth-calm-form" role="status">
      <p className="eyebrow">Email verification</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
        {state === "done" ? "Email verified" : state === "error" ? "Verification failed" : "Verifying…"}
      </h1>
      {state === "working" && (
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Confirming your email address…</p>
      )}
      {state === "done" && (
        <>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Your email is verified. You can now use your Jalanin student account.
          </p>
          <Link href="/dashboard" className="btn btn-primary mt-5 w-full">Go to dashboard</Link>
        </>
      )}
      {state === "error" && (
        <>
          <p className="alert alert-error mt-4">{error}</p>
          <Link href="/auth/login" className="btn btn-outline mt-5 w-full">Back to log in</Link>
        </>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyForm />
    </Suspense>
  );
}
