import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  searchStudentsForPlacement: vi.fn(),
  listEligibleApplicationsForStudent: vi.fn(),
  setContactHandling: vi.fn(),
}));

vi.mock("@/lib/auth/require", () => ({
  requireAdmin: mocks.requireAdmin,
  AuthError: class AuthError extends Error {
    constructor(public status: 401 | 403, message: string) { super(message); }
  },
}));
vi.mock("@/features/admin/service", () => ({
  searchStudentsForPlacement: mocks.searchStudentsForPlacement,
  listEligibleApplicationsForStudent: mocks.listEligibleApplicationsForStudent,
  setContactHandling: mocks.setContactHandling,
}));

import { AuthError } from "@/lib/auth/require";
import { GET as searchStudents } from "@/app/api/admin/students/search/route";
import { GET as eligibleApplications } from "@/app/api/admin/students/[id]/applications/route";
import { POST as contactHandling } from "@/app/api/admin/contacts/[id]/handling/route";

const studentId = "00000000-0000-4000-8000-000000000001";
const contactId = "00000000-0000-4000-8000-000000000002";
const get = (url: string) => new Request(url, { method: "GET" });
const post = (url: string, body: unknown) => new Request(url, {
  method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
});

beforeEach(() => {
  vi.resetAllMocks();
  mocks.requireAdmin.mockResolvedValue({ id: "admin" });
  mocks.searchStudentsForPlacement.mockResolvedValue([]);
  mocks.listEligibleApplicationsForStudent.mockResolvedValue([]);
  mocks.setContactHandling.mockResolvedValue(undefined);
});

describe("new admin endpoints — authorization first (A1/A3)", () => {
  it.each([401, 403] as const)("search preserves auth %s before querying", async (status) => {
    mocks.requireAdmin.mockRejectedValue(new AuthError(status, "Unauthorized"));
    const res = await searchStudents(get("https://jalanin.example/api/admin/students/search?q=am"));
    expect(res.status).toBe(status);
    expect(mocks.searchStudentsForPlacement).not.toHaveBeenCalled();
  });

  it.each([401, 403] as const)("eligible applications preserve auth %s", async (status) => {
    mocks.requireAdmin.mockRejectedValue(new AuthError(status, "Unauthorized"));
    const res = await eligibleApplications(get(`https://x/s`), { params: { id: studentId } });
    expect(res.status).toBe(status);
    expect(mocks.listEligibleApplicationsForStudent).not.toHaveBeenCalled();
  });

  it.each([401, 403] as const)("contact handling preserves auth %s before mutation", async (status) => {
    mocks.requireAdmin.mockRejectedValue(new AuthError(status, "Unauthorized"));
    const res = await contactHandling(post(`https://x/${contactId}`, { handled: true }), { params: { id: contactId } });
    expect(res.status).toBe(status);
    expect(mocks.setContactHandling).not.toHaveBeenCalled();
  });
});

describe("new admin endpoints — input validation", () => {
  it("passes the trimmed query to student search and returns results", async () => {
    mocks.searchStudentsForPlacement.mockResolvedValue([{ userId: studentId, displayName: "A", email: "a@x.com" }]);
    const res = await searchStudents(get("https://jalanin.example/api/admin/students/search?q=am"));
    expect(res.status).toBe(200);
    expect(mocks.searchStudentsForPlacement).toHaveBeenCalledWith("am");
    expect((await res.json()).results).toHaveLength(1);
  });

  it("rejects invalid student UUIDs before querying applications", async () => {
    const res = await eligibleApplications(get("https://x"), { params: { id: "invalid" } });
    expect(res.status).toBe(400);
    expect(mocks.listEligibleApplicationsForStudent).not.toHaveBeenCalled();
  });

  it("loads eligible applications for a valid student", async () => {
    const res = await eligibleApplications(get("https://x"), { params: { id: studentId } });
    expect(res.status).toBe(200);
    expect(mocks.listEligibleApplicationsForStudent).toHaveBeenCalledWith(studentId);
  });

  it.each(["invalid", null, [], {}, { handled: "yes" }, { handled: 1 }])(
    "rejects invalid contact handling bodies %j",
    async (body) => {
      const res = await contactHandling(post(`https://x/${contactId}`, body), { params: { id: contactId } });
      expect(res.status).toBe(400);
      expect(mocks.setContactHandling).not.toHaveBeenCalled();
    },
  );

  it("applies mark-handled and reopen transitions for the admin actor", async () => {
    for (const handled of [true, false]) {
      const res = await contactHandling(post(`https://x/${contactId}`, { handled }), { params: { id: contactId } });
      expect(res.status).toBe(200);
      expect(mocks.setContactHandling).toHaveBeenCalledWith({ adminId: "admin", contactId, handled });
    }
  });
});
