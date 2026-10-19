import { describe, expect, it } from "vitest";
import {
  allowedNextStatuses,
  canTransition,
  formatSgd,
  parseSgdToMinor,
} from "@/lib/workflow/transitions";

describe("application transitions (PRD §7.7)", () => {
  it("allows Draft → New for the owning student", () => {
    expect(
      canTransition({
        from: null,
        to: "New",
        actor: "student",
        needsReReview: false,
        hasValidQuotation: false,
        revisionReviewed: true,
      }).ok,
    ).toBe(true);
  });

  it("rejects arbitrary jumps (New → Accepted)", () => {
    const r = canTransition({
      from: "New",
      to: "Accepted",
      actor: "admin",
      needsReReview: false,
      hasValidQuotation: false,
      revisionReviewed: true,
    });
    expect(r.ok).toBe(false);
  });

  it("rejects student-performed admin transitions", () => {
    const r = canTransition({
      from: "New",
      to: "In Review",
      actor: "student",
      needsReReview: false,
      hasValidQuotation: false,
      revisionReviewed: true,
    });
    expect(r.ok).toBe(false);
  });

  it("allows stage-only Quotation Sent without quotation data", () => {
    const missing = canTransition({
      from: "In Review",
      to: "Quotation Sent",
      actor: "admin",
      needsReReview: false,
      hasValidQuotation: false,
      revisionReviewed: true,
    });
    expect(missing.ok).toBe(true);
    const present = canTransition({
      from: "In Review",
      to: "Quotation Sent",
      actor: "admin",
      needsReReview: false,
      hasValidQuotation: true,
      revisionReviewed: true,
    });
    expect(present.ok).toBe(true);
  });

  it("blocks quote/accept/complete while re-review is pending (D10)", () => {
    for (const to of ["Quotation Sent", "Accepted", "Completed"] as const) {
      const from = to === "Quotation Sent" ? "In Review" : to === "Accepted" ? "Quotation Sent" : "Accepted";
      const r = canTransition({
        from,
        to,
        actor: "admin",
        needsReReview: true,
        hasValidQuotation: true,
        revisionReviewed: false,
      });
      expect(r.ok).toBe(false);
      expect(r.reason).toMatch(/re-review/i);
    }
  });

  it("requires the latest revision to be reviewed before Quotation Sent", () => {
    const r = canTransition({
      from: "In Review",
      to: "Quotation Sent",
      actor: "admin",
      needsReReview: false,
      hasValidQuotation: true,
      revisionReviewed: false,
    });
    expect(r.ok).toBe(false);
  });

  it("permits admin-only reopen Rejected → In Review (D15, interim B03)", () => {
    expect(
      canTransition({
        from: "Rejected",
        to: "In Review",
        actor: "admin",
        needsReReview: false,
        hasValidQuotation: false,
        revisionReviewed: true,
      }).ok,
    ).toBe(true);
    expect(
      canTransition({
        from: "Rejected",
        to: "In Review",
        actor: "student",
        needsReReview: false,
        hasValidQuotation: false,
        revisionReviewed: true,
      }).ok,
    ).toBe(false);
  });

  it("keeps Completed terminal (no outgoing transitions)", () => {
    expect(allowedNextStatuses("Completed", "admin")).toEqual([]);
  });
});

describe("SGD money helpers (D12 — integer minor units, never floats)", () => {
  it("parses major-unit input to cents", () => {
    expect(parseSgdToMinor("1250.50")).toBe(125050);
    expect(parseSgdToMinor("1,250")).toBe(125000);
    expect(parseSgdToMinor("99.9")).toBe(9990);
  });

  it("rejects invalid amounts", () => {
    expect(parseSgdToMinor("0")).toBeNull();
    expect(parseSgdToMinor("-5")).toBeNull();
    expect(parseSgdToMinor("12.345")).toBeNull();
    expect(parseSgdToMinor("abc")).toBeNull();
    expect(parseSgdToMinor("")).toBeNull();
  });

  it("formats minor units without float arithmetic", () => {
    expect(formatSgd(125050)).toBe("SGD 1,250.50");
    expect(formatSgd(100)).toBe("SGD 1.00");
  });
});
