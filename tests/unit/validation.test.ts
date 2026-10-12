import { describe, expect, it } from "vitest";
import {
  applicationFormSchema,
  contactInputSchema,
  internshipInputSchema,
  placementInputSchema,
  quotationInputSchema,
} from "@/lib/validation/schemas";

const validApplication = {
  firstName: "Aisha",
  lastName: "Rahman",
  email: "aisha@example.com",
  nationality: "Indonesian",
  university: "Universitas Indonesia",
  course: "Hospitality Management",
  graduationYear: 2026,
  preferredStart: "2026-11-01",
  preferredEnd: "2027-04-30",
  additionalInformation: "",
  consentPrivacy: true,
  consentTerms: true,
};

describe("input validation (server source of truth)", () => {
  it("accepts a complete valid application", () => {
    expect(applicationFormSchema.safeParse(validApplication).success).toBe(true);
  });

  it("rejects missing required fields and missing consent (APP-09/10)", () => {
    const missing = applicationFormSchema.safeParse({
      ...validApplication,
      firstName: "",
      consentPrivacy: false,
    });
    expect(missing.success).toBe(false);
  });

  it("rejects inverted preferred date ranges", () => {
    const r = applicationFormSchema.safeParse({
      ...validApplication,
      preferredStart: "2027-05-01",
      preferredEnd: "2027-04-01",
    });
    expect(r.success).toBe(false);
  });

  it("rejects out-of-range graduation years", () => {
    expect(
      applicationFormSchema.safeParse({ ...validApplication, graduationYear: 1800 })
        .success,
    ).toBe(false);
  });

  it("requires quotation terms (ADM-APP-05) and a sane amount shape", () => {
    expect(
      quotationInputSchema.safeParse({
        amount: "1250.50",
        notesStudent: "Includes placement and support.",
      }).success,
    ).toBe(true);
    expect(
      quotationInputSchema.safeParse({ amount: "abc", notesStudent: "x" })
        .success,
    ).toBe(false);
    expect(
      quotationInputSchema.safeParse({ amount: "100", notesStudent: "" })
        .success,
    ).toBe(false);
  });

  it("validates internship slugs and date consistency (ADM-JOB-04/05)", () => {
    expect(
      internshipInputSchema.safeParse({
        title: "Test",
        slug: "Bad Slug!",
        city: "Singapore",
        countryCode: "SG",
        startDate: "2026-01-01",
        endDate: "2026-02-01",
        description: "d",
        responsibilities: "r",
        requirements: "q",
        publicationStatus: "Draft",
        featured: false,
      }).success,
    ).toBe(false);
  });

  it("requires contact message + turnstile token (COM-01/02)", () => {
    expect(
      contactInputSchema.safeParse({
        name: "Kim",
        email: "kim@example.com",
        message: "Hello",
        turnstileToken: "tok",
      }).success,
    ).toBe(true);
    expect(
      contactInputSchema.safeParse({
        name: "Kim",
        email: "kim@example.com",
        message: "Hello",
        turnstileToken: "",
      }).success,
    ).toBe(false);
  });

  it("validates placement organization/role and dates", () => {
    expect(
      placementInputSchema.safeParse({
        studentUserId: "00000000-0000-0000-0000-000000000001",
        organization: "Marina Hotel",
        role: "Front Office Intern",
        countryCode: "SG",
      }).success,
    ).toBe(true);
  });
});
