import { describe, expect, it } from "vitest";
import { classifyApplicationError } from "@/features/applications/errors";
import { applicationRequestSchema, submissionRequestSchema } from "@/features/applications/request";
import { DomainError } from "@/lib/errors/domain-error";
import { applicationFormBase } from "@/lib/validation/schemas";

const internshipId = "00000000-0000-4000-8000-000000000001";

describe("application request boundary", () => {
  it.each([null, [], {}, { internshipId: [], values: {} }, { internshipId: "bad", values: {} },
    { internshipId, values: [] }, { internshipId, values: null }, { internshipId, values: "bad" }])(
    "rejects malformed bodies %j", (body) => {
      expect(applicationRequestSchema.safeParse(body).success).toBe(false);
      expect(submissionRequestSchema.safeParse(body).success).toBe(false);
    },
  );
  it("accepts partial drafts and validates retry identifiers", () => {
    expect(applicationRequestSchema.safeParse({ internshipId, values: {} }).success).toBe(true);
    for (const key of ["", "x".repeat(161), "key\nprivate", 12, {}]) {
      expect(submissionRequestSchema.safeParse({ internshipId, values: {}, idempotencyKey: key }).success).toBe(false);
    }
    expect(submissionRequestSchema.safeParse({ internshipId, values: {}, idempotencyKey: "retry-1" }).success).toBe(true);
  });
});

describe("application error classifier", () => {
  it("preserves explicit domain business-rule messages", () => {
    for (const error of [new DomainError("Please upload a CV."), new DomainError("A CV upload is required before submitting."),
      new DomainError("Applications in status Quotation Sent are locked for student editing.")]) {
      expect(classifyApplicationError(error)).toBe(error.message);
    }
  });
  it("preserves readable field validation", () => {
    const result = applicationFormBase.partial().safeParse({ email: "invalid" });
    if (result.success) throw new Error("Expected validation failure");
    expect(classifyApplicationError(result.error)).toContain("email: Enter a valid email address.");
  });
  it("does not classify DB failures, wrapped failures or arbitrary text as user errors", () => {
    for (const error of [new Error("Failed query: INSERT private@example.com"),
      new Error("A CV upload is required before submitting."),
      new Error("Applications in status Quotation Sent are locked for student editing."),
      new Error("Application not found."),
      Object.assign(new Error("Application not found."), { code: "23505" }),
      Object.assign(new Error("Internship not found."), { cause: new Error("SQL") }),
      new TypeError("Application not found."), "A CV upload is required before submitting.", null]) {
      expect(classifyApplicationError(error)).toBeNull();
    }
  });
});
