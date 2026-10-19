import { ZodError } from "zod";
import { DomainError } from "@/lib/errors/domain-error";

/** null means an unexpected failure: log an incident and return a generic 500. */
export function classifyApplicationError(error: unknown): string | null {
  if (error instanceof DomainError) return error.message;
  if (error instanceof ZodError) {
    return error.issues
      .map((issue) => `${issue.path.join(".") || "Application"}: ${issue.message}`)
      .join("; ");
  }
  return null;
}
