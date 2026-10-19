import { describe, expect, it } from "vitest";
import { RE_REVIEW_GUIDANCE, statusGuidanceFor } from "@/lib/workflow/status-guidance";

describe("student status guidance (S1 — existing lifecycle states only)", () => {
  it("covers every existing application status plus drafts", () => {
    for (const status of ["Draft", "New", "In Review", "Quotation Sent", "Accepted", "Rejected", "Completed"]) {
      const g = statusGuidanceFor(status);
      expect(g.status.length).toBeGreaterThan(0);
      expect(g.next.length).toBeGreaterThan(0);
      expect(g.action.length).toBeGreaterThan(0);
    }
  });

  it("explains queued-not-delivered quotations and reply-by-email", () => {
    const g = statusGuidanceFor("Quotation Sent");
    expect(g.actionRequired).toBe(true);
    expect(`${g.status} ${g.next}`.toLowerCase()).toContain("queued");
    expect(g.action.toLowerCase()).toContain("reply");
    expect(g.action.toLowerCase()).toContain("email");
  });

  it("presents re-review as admin review, never a student action", () => {
    expect(RE_REVIEW_GUIDANCE.actionRequired).toBe(false);
    expect(RE_REVIEW_GUIDANCE.next).toMatch(/team needs to review/i);
    expect(RE_REVIEW_GUIDANCE.action).toMatch(/no action required/i);
  });

  it("keeps In Review guidance action-free", () => {
    const g = statusGuidanceFor("In Review");
    expect(g.actionRequired).toBe(false);
    expect(g.action).toMatch(/no action required/i);
  });

  it("falls back neutrally for unknown statuses without deadlines or percentages", () => {
    const g = statusGuidanceFor("SomethingElse");
    const text = `${g.status} ${g.next} ${g.action}`.toLowerCase();
    expect(text).not.toMatch(/%/);
    expect(text).not.toMatch(/deadline|estimate|guarantee/);
  });
});
