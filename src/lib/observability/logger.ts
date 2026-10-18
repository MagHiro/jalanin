import { randomUUID } from "node:crypto";

/**
 * Structured operational error logs for Vercel/Node. Identifiers allow an API
 * failure to be matched to its server log without disclosing request payloads,
 * tokens, user emails, storage paths, or SQL statements.
 */
export function logServerError(
  event: string,
  error: unknown,
  details: Record<string, string | number | boolean | null> = {},
): string {
  const incidentId = randomUUID();
  const errorType = error instanceof Error ? error.name : typeof error;
  const candidateCode =
    error && typeof error === "object" && "code" in error
      ? (error as { code?: unknown }).code
      : undefined;
  const errorCode = typeof candidateCode === "string"
    ? candidateCode.slice(0, 40)
    : undefined;
  const record = {
    timestamp: new Date().toISOString(),
    level: "error",
    event,
    incidentId,
    errorType,
    ...(errorCode ? { errorCode } : {}),
    ...details,
    ...(process.env.NODE_ENV === "production" || !(error instanceof Error)
      ? {}
      : { message: error.message.slice(0, 500) }),
  };
  console.error(JSON.stringify(record));
  return incidentId;
}
