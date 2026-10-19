import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { AuthError } from "@/lib/auth/require";
import { DomainError } from "@/lib/errors/domain-error";
import { logServerError } from "@/lib/observability/logger";

export const adminIdSchema = z.string().uuid();

export async function readAdminBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch (error) {
    if (error instanceof SyntaxError) throw new DomainError("Invalid JSON request body.");
    throw error;
  }
}

export function adminMutationError(event: string, error: unknown): NextResponse {
  if (error instanceof AuthError) {
    return NextResponse.json({ ok: false }, { status: error.status });
  }
  if (error instanceof DomainError || error instanceof ZodError) {
    const message = error instanceof DomainError
      ? error.message
      : error.issues[0]?.message ?? "Invalid request.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
  const incidentId = logServerError(event, error);
  return NextResponse.json(
    { ok: false, error: "We could not complete this action. Please try again later.", incidentId },
    { status: 503 },
  );
}
