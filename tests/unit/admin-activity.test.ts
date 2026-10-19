import { describe, expect, it } from "vitest";
import { adminActivityHref, describeAdminActivity } from "@/lib/ui/admin-activity";

describe("admin overview activity labels", () => {
  it("turns application transitions into readable, accurate text", () => {
    expect(describeAdminActivity("application", "status:New->In Review")).toEqual({
      title: "Application moved to In Review",
      detail: "New → In Review",
      tone: "transition",
    });
    expect(describeAdminActivity("placement", "status:Preparing->Confirmed").title).toBe("Placement moved to Confirmed");
  });

  it("uses source action semantics without inventing actor names", () => {
    expect(describeAdminActivity("application", "submitted").title).toBe("Application submitted");
    expect(describeAdminActivity("application", "student-revision").detail).toBe("Student submitted changes");
    expect(describeAdminActivity("application", "revision-acknowledged").title).toBe("Revision reviewed");
    expect(describeAdminActivity("placement", "created").title).toBe("Placement created");
    expect(describeAdminActivity("internship", "updated").title).toBe("Internship updated");
  });

  it("does not expose unknown raw action codes as headlines", () => {
    expect(describeAdminActivity("notification", "needs_attention").title).toBe("Record activity");
    expect(describeAdminActivity("notification", "needs_attention").detail).toBe("needs attention");
  });

  it("only links to supported routes for valid UUID record IDs", () => {
    const id = "65bb4433-1111-4111-8111-111111111111";
    expect(adminActivityHref("application", id)).toBe(`/admin/applications/${id}`);
    expect(adminActivityHref("placement", id)).toBe(`/admin/placements/${id}/edit`);
    expect(adminActivityHref("notification", id)).toBeNull();
    expect(adminActivityHref("application", "../../wrong")).toBeNull();
  });
});
