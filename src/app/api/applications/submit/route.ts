import { NextResponse } from "next/server";
import { requireStudent, AuthError } from "@/lib/auth/require";
import {
  editSubmittedApplication,
  submitApplication,
} from "@/features/applications/service";
import { db } from "@/lib/db/client";
import { applications } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

// Final submit: full validation, eligibility, CV presence, atomic New row,
// audit + admin notification + outbox email. Idempotent — the
// Idempotency-Key header (or body key) makes double-clicks/retries converge.
export async function POST(request: Request) {
  try {
    const user = await requireStudent();
    if (
      process.env.REQUIRE_VERIFIED_EMAIL === "true" &&
      !user.emailConfirmed
    ) {
      return NextResponse.json(
        { ok: false, error: "Verify your email before submitting." },
        { status: 403 },
      );
    }
    const body = (await request.json()) as {
      internshipId?: string;
      values?: Record<string, unknown>;
      idempotencyKey?: string;
    };
    if (!body.internshipId || !body.values) {
      return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
    }
    const idempotencyKey =
      request.headers.get("Idempotency-Key") ??
      body.idempotencyKey ??
      `${user.id}:${body.internshipId}`;

    // If the single row is already submitted, treat as a revision attempt
    // (post-submit edit path with re-review) rather than a duplicate submit.
    const existing = await db
      .select()
      .from(applications)
      .where(
        and(
          eq(applications.applicantUserId, user.id),
          eq(applications.internshipId, body.internshipId),
        ),
      )
      .limit(1);
    if (existing.length > 0 && !existing[0].isDraft) {
      // Retry safety: when the payload is byte-identical to the stored row,
      // treat the retry as a duplicate no-op (double-click protection).
      // Changed payloads go through the audited revision path instead.
      const row = existing[0];
      const same =
        String(body.values.firstName ?? "") === row.firstName &&
        String(body.values.lastName ?? "") === row.lastName &&
        String(body.values.email ?? "") === row.email &&
        String(body.values.nationality ?? "") === row.nationality &&
        String(body.values.university ?? "") === row.university &&
        String(body.values.course ?? "") === row.course &&
        Number(body.values.graduationYear) === row.graduationYear &&
        String(body.values.preferredStart ?? "") === row.preferredStart &&
        String(body.values.preferredEnd ?? "") === row.preferredEnd &&
        String(body.values.additionalInformation ?? "") ===
          (row.additionalInformation ?? "");
      if (same) {
        const { applicationRef } = await import("@/lib/utils");
        return NextResponse.json({
          ok: true,
          applicationId: row.id,
          ref: applicationRef(row.id),
          duplicate: true,
        });
      }
      const revised = await editSubmittedApplication({
        userId: user.id,
        applicationId: existing[0].id,
        values: body.values,
      });
      return NextResponse.json({
        ok: true,
        applicationId: existing[0].id,
        revision: revised.revision,
        revised: true,
      });
    }

    const result = await submitApplication({
      userId: user.id,
      userEmail: user.email,
      internshipId: body.internshipId,
      values: body.values,
      idempotencyKey,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ ok: false, error: "Login required." }, { status: 401 });
    }
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Submission failed." },
      { status: 400 },
    );
  }
}
